import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { format } from "date-fns";
import { FiTrash2, FiPercent, FiTrendingUp } from "react-icons/fi";
import { Title } from "../components/Layout";
import { UserAvatar } from "../components/Layout/EntryRow";
import { ActionButton } from "../components/Buttons";
import { InlineError } from "../components/Notifications";
import { SAVE_SPLIT_SETTING, DELETE_SPLIT_SETTING } from "../utils/mutations";
import { fixRounding } from "../utils/helpers";

const METHODS = {
  proportional: {
    label: "Proportional",
    description: "Each person covers shared expenses in proportion to their share of shared income that month.",
    icon: FiTrendingUp,
  },
  percentage: {
    label: "Fixed split",
    description: "Each person covers a fixed percentage of shared expenses, regardless of income.",
    icon: FiPercent,
  },
};

const monthKeyToDate = (key) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

// the setting that applies right now (latest one not in the future)
function currentSettingID(settings) {
  const thisMonth = format(new Date(), "yyyy-MM");
  const applicable = settings.filter((s) => s.effectiveMonth <= thisMonth);
  return applicable[applicable.length - 1]?._id;
}

const BudgetSettings = ({ budgetState, refetch }) => {
  const owners = budgetState.ownerIDs;
  const settings = budgetState.splitSettings || [];
  const activeID = currentSettingID(settings);

  const evenShare = fixRounding(100 / owners.length, 2);
  const initialShares = () =>
    Object.fromEntries(
      owners.map((owner, i) => [
        owner._id,
        // put any rounding remainder on the last person so it totals 100
        i === owners.length - 1
          ? fixRounding(100 - evenShare * (owners.length - 1), 2)
          : evenShare,
      ])
    );

  const [effectiveMonth, setEffectiveMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [method, setMethod] = useState("percentage");
  const [shares, setShares] = useState(initialShares);
  const [errorState, setErrorState] = useState(null);

  const total = fixRounding(
    Object.values(shares).reduce((sum, value) => sum + (Number(value) || 0), 0),
    2
  );
  const isValid =
    /^\d{4}-\d{2}$/.test(effectiveMonth) &&
    (method === "proportional" || total === 100);
  // a new setting applies from its month onward, replacing any setting that
  // starts in that month or later
  const replacing = settings.filter((s) => s.effectiveMonth >= effectiveMonth);
  const describe = (s) =>
    `${format(monthKeyToDate(s.effectiveMonth), "MMM yyyy")} · ${
      s.method === "percentage"
        ? s.shares.map((share) => `${fixRounding(share.percent, 2)}%`).join(" / ")
        : METHODS.proportional.label.toLowerCase()
    }`;

  // shares are capped so the total can never pass 100%; with two people the
  // other share follows automatically
  const updateShare = (userID, raw) => {
    const othersTotal = Object.entries(shares)
      .filter(([id]) => id !== userID)
      .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
    const cap = owners.length === 2 ? 100 : fixRounding(100 - othersTotal, 2);
    const value =
      raw === "" ? "" : Math.min(Math.max(fixRounding(Number(raw) || 0, 2), 0), cap);

    const next = { ...shares, [userID]: value };
    if (owners.length === 2) {
      const other = owners.find((owner) => owner._id !== userID);
      next[other._id] = fixRounding(100 - (Number(value) || 0), 2);
    }
    setShares(next);
  };

  const onCompleted = () => {
    setErrorState(null);
    refetch();
  };
  const onError = (err) => setErrorState(err.message);

  const [saveSetting, { loading: saving }] = useMutation(SAVE_SPLIT_SETTING, {
    onCompleted,
    onError,
  });
  const [deleteSetting] = useMutation(DELETE_SPLIT_SETTING, {
    onCompleted,
    onError,
  });

  const submit = () =>
    saveSetting({
      variables: {
        input: {
          budgetID: budgetState._id,
          effectiveMonth,
          method,
          shares:
            method === "percentage"
              ? owners.map((owner) => ({
                  userID: owner._id,
                  percent: Number(shares[owner._id]) || 0,
                }))
              : [],
        },
      },
    });

  const ownerByID = (id) => owners.find((owner) => owner._id === id);

  return (
    <div className="settings-grid">
      <section className="full-container settings-card">
        <Title
          text="Expense split"
          subtitle="How shared expenses are divided. Each setting applies from its month until the next one starts."
        />
        <ol className="timeline">
          {settings.map((setting, i) => {
            const next = settings[i + 1];
            const Icon = METHODS[setting.method].icon;
            return (
              <li
                key={setting._id}
                className={`timeline-item${
                  setting._id === activeID ? " timeline-item-active" : ""
                }`}
              >
                <span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-body">
                  <div className="timeline-head">
                    <span className="timeline-range">
                      {i === 0 ? "From the beginning" : format(monthKeyToDate(setting.effectiveMonth), "MMM yyyy")}
                      {next
                        ? ` – ${format(
                            new Date(
                              monthKeyToDate(next.effectiveMonth).getFullYear(),
                              monthKeyToDate(next.effectiveMonth).getMonth() - 1,
                              1
                            ),
                            "MMM yyyy"
                          )}`
                        : " onward"}
                    </span>
                    {setting._id === activeID && (
                      <span className="badge badge-accent">Current</span>
                    )}
                    {settings.length > 1 && (
                      <button
                        type="button"
                        className="icon-button icon-button-sm timeline-delete"
                        onClick={() =>
                          deleteSetting({
                            variables: {
                              budgetID: budgetState._id,
                              settingID: setting._id,
                            },
                          })
                        }
                        aria-label={`Remove setting starting ${setting.effectiveMonth}`}
                        title="Remove this setting"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                  <div className="timeline-method">
                    <Icon aria-hidden="true" />
                    {METHODS[setting.method].label}
                    {i === 0 && (
                      <span className="timeline-since">
                        since {format(monthKeyToDate(setting.effectiveMonth), "MMM yyyy")}
                      </span>
                    )}
                  </div>
                  {setting.method === "percentage" && (
                    <div className="share-chips">
                      {setting.shares.map((share) => {
                        const owner = ownerByID(share.userID);
                        return owner ? (
                          <span key={share.userID} className="share-chip">
                            <UserAvatar user={owner} />
                            {fixRounding(share.percent, 2)}%
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="full-container settings-card">
        <Title
          text="Change split"
          subtitle="Applies from the chosen month onward. Any setting starting in that month or later is replaced."
        />
        {errorState && <InlineError text={errorState} />}
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <div className="form-inline-date-monthly">
            <label htmlFor="effectiveMonth">Starting month</label>
            <input
              id="effectiveMonth"
              type="month"
              value={effectiveMonth}
              onChange={(e) => setEffectiveMonth(e.target.value)}
            />
            {replacing.length > 0 && (
              <div className="replace-warning" role="status">
                <strong>
                  Replaces {replacing.length} setting
                  {replacing.length === 1 ? "" : "s"}:
                </strong>{" "}
                {replacing.map(describe).join(", ")}
              </div>
            )}
          </div>

          <div className="form-inline-checkbox">
            <span className="form-label">Method</span>
            <div className="segmented" role="radiogroup" aria-label="Method">
              {Object.entries(METHODS).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={method === key}
                  className={`segmented-option${
                    method === key ? " segmented-active" : ""
                  }`}
                  onClick={() => setMethod(key)}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
            <span className="form-hint">{METHODS[method].description}</span>
          </div>

          {method === "percentage" && (
            <div className="share-editor">
              {owners.map((owner) => (
                <div key={owner._id} className="share-row">
                  <UserAvatar user={owner} />
                  <label className="share-email" htmlFor={`share_${owner._id}`}>
                    {owner.email}
                  </label>
                  <div className="percent-input">
                    <input
                      id={`share_${owner._id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={1}
                      value={shares[owner._id]}
                      onChange={(e) => updateShare(owner._id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                    <span aria-hidden="true">%</span>
                  </div>
                </div>
              ))}
              <div className="share-total">
                <div className="share-bar" aria-hidden="true">
                  {owners.map((owner) => (
                    <span
                      key={owner._id}
                      style={{
                        width: `${Number(shares[owner._id]) || 0}%`,
                        backgroundColor: owner.userColor
                          ? `#${owner.userColor}`
                          : "var(--accent)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className={`share-total-label${
                    total === 100 ? "" : " share-total-invalid"
                  }`}
                >
                  {total}% of 100%
                  {total < 100 && ` · ${fixRounding(100 - total, 2)}% unassigned`}
                </span>
              </div>
            </div>
          )}
        </form>
        <ActionButton
          action={submit}
          text={
            saving
              ? "Saving…"
              : replacing.length
              ? `Save and replace ${replacing.length}`
              : "Save setting"
          }
          additionalClass={"large-button"}
          disabled={!isValid || saving}
        />
      </section>
    </div>
  );
};

export default BudgetSettings;
