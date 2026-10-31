import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format } from "date-fns";
import { LuSun, LuSnowflake, LuCloudSun } from "react-icons/lu";
import { FiPlus, FiTrash2, FiRepeat, FiEdit2, FiX } from "react-icons/fi";
import {
  SAVE_TIRE,
  DELETE_TIRE,
  ADD_TIRE_CHANGE,
  UPDATE_TIRE_CHANGE,
  DELETE_TIRE_CHANGE,
} from "../utils/mutations";
import { toCurrency, toEffectiveDate, dateInputToEffectiveDate } from "../utils/helpers";
import { getChartColors, withAlpha } from "../utils/theme";
import { formatKm } from "./vehicleSettings";

export const SEASONS = [
  { value: "summer", label: "Summer", icon: LuSun, glyph: "☀" },
  { value: "winter", label: "Winter", icon: LuSnowflake, glyph: "❄" },
  { value: "all-season", label: "All-season", icon: LuCloudSun, glyph: "◐" },
];
const seasonOf = (value) => SEASONS.find((s) => s.value === value) || SEASONS[0];

export const SeasonIcon = ({ season }) => {
  const { icon: Icon, label } = seasonOf(season);
  return (
    <span className={`season-icon season-${season}`} title={label}>
      <Icon aria-label={label} />
    </span>
  );
};

// "☀ Michelin Pilot Sport 4S" for choosing a set: the season as a glyph
// (options can't hold icons), and "(2)" in buying order when two sets share
// a name
export function tireOptionLabel(tire) {
  return `${seasonOf(tire.season).glyph} ${tireLabel(tire)}`;
}

// "Michelin Pilot Sport 4S (2025)": the year the set first went on ("new"
// for a set that hasn't been on yet)
export function tireLabel(tire) {
  return `${tire.brand} (${tire.firstDate ? new Date(tire.firstDate).getFullYear() : "new"})`;
}

const seasonColor = (colors, season) =>
  season === "winter" ? colors.winter : season === "summer" ? colors.summer : colors.muted;

// one row per set of tires, a bar for each time it was on the car
export function TireTimeline({ tires, stints, start, end, isNarrow }) {
  // rows in the order each set first appears in the range
  const shown = useMemo(() => {
    const firstSeen = new Map();
    stints
      .filter((s) => s.toDate >= start && s.fromDate < end)
      .forEach((s) => {
        const seen = Math.max(s.fromDate.getTime(), start.getTime());
        if (!firstSeen.has(s.tireID) || seen < firstSeen.get(s.tireID)) {
          firstSeen.set(s.tireID, seen);
        }
      });
    return tires
      .filter((t) => firstSeen.has(t._id))
      .sort((a, b) => firstSeen.get(a._id) - firstSeen.get(b._id));
  }, [tires, stints, start, end]);

  const colors = getChartColors();
  const labels = shown.map((t) => `${seasonOf(t.season).glyph}  ${tireLabel(t)}`);
  const rowOf = new Map(shown.map((t, i) => [t._id, labels[i]]));

  const data = {
    labels,
    datasets: SEASONS.map((season) => {
      const color = seasonColor(colors, season.value);
      const rows = stints.filter(
        (s) => rowOf.has(s.tireID) && shown.find((t) => t._id === s.tireID).season === season.value
      );
      return {
        label: season.label,
        data: rows.map((s) => ({
          x: [Math.max(s.fromDate.getTime(), start.getTime()), Math.min(s.toDate.getTime(), end.getTime())],
          y: rowOf.get(s.tireID),
          stint: s,
        })),
        backgroundColor: rows.map((s) => withAlpha(color, s.current ? 0.95 : 0.7)),
        borderColor: color,
        borderWidth: rows.map((s) => (s.current ? 1.5 : 0)),
        borderSkipped: false,
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 1,
        grouped: false,
      };
    }).filter((d) => d.data.length),
  };

  const months = (end - start) / (30.4 * 24 * 3600 * 1000);
  const step = months > 48 ? 12 : months > 24 ? 6 : months > 12 ? 3 : isNarrow ? 2 : 1;
  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0]?.label,
          label: (item) => {
            const s = item.raw.stint;
            return [
              `${format(s.fromDate, "MMM d, yyyy")} - ${s.current ? "now" : format(s.toDate, "MMM d, yyyy")}`,
              `${formatKm(s.fromOdometer)} to ${formatKm(s.toOdometer)}: ${formatKm(s.km)}${s.current ? " so far" : ""}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: start.getTime(),
        max: end.getTime(),
        grid: { color: `${colors.muted}18` },
        border: { display: false },
        afterBuildTicks: (scale) => {
          const ticks = [];
          const d = new Date(start);
          for (let i = 0; d < end; i += 1, d.setMonth(d.getMonth() + 1)) {
            if (d.getMonth() % step === 0 || (step === 1 && i >= 0)) {
              ticks.push({ value: d.getTime() });
            }
          }
          scale.ticks = ticks;
        },
        ticks: {
          color: colors.muted,
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: false,
          callback: (value) => {
            const d = new Date(value);
            return d.getMonth() === 0 || step >= 6 ? format(d, "MMM yy") : format(d, "MMM");
          },
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        // each label in its season's colour, so the glyph reads at a glance
        ticks: {
          color: (context) => seasonColor(colors, shown[context.index]?.season),
          font: { size: 12 },
          padding: 6,
        },
      },
    },
  };

  if (!shown.length) {
    return <p className="empty-state">No tires were on the car in this range.</p>;
  }
  return (
    <div className="tire-chart" style={{ height: 40 + shown.length * 38 }}>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}

const blankTire = { brand: "", season: "summer", cost: "", initialOdometer: "", retired: false };

// the vehicle's tires: figures for each set, plus adding and editing sets
// and changes
export function TiresCard({ budgetID, vehicle, tires, changes, records = [], refetch }) {
  const [adding, setAdding] = useState(null); // null, "tire" or "change"
  const [tireForm, setTireForm] = useState(blankTire);
  // the set being edited in the tire form, or null when adding one
  const [editingTireID, setEditingTireID] = useState(null);
  const [changeForm, setChangeForm] = useState(null);
  // the tire change open in the dialog
  const [openChangeID, setOpenChangeID] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const mutationOptions = {
    onCompleted: () => {
      setAdding(null);
      setEditingTireID(null);
      setOpenChangeID(null);
      setErrorState(null);
      refetch();
    },
    onError: (err) => setErrorState(err.message),
  };
  const [saveTire, { loading: savingTire }] = useMutation(SAVE_TIRE, mutationOptions);
  const [deleteTire] = useMutation(DELETE_TIRE, mutationOptions);
  const [addChange, { loading: savingChange }] = useMutation(ADD_TIRE_CHANGE, mutationOptions);
  const [updateChange, { loading: updatingChange }] = useMutation(UPDATE_TIRE_CHANGE, mutationOptions);
  const [deleteChange, { loading: deletingChange }] = useMutation(DELETE_TIRE_CHANGE, mutationOptions);

  const startAddTire = () => {
    if (adding === "tire" && !editingTireID) {
      setAdding(null);
      return;
    }
    setTireForm(blankTire);
    setEditingTireID(null);
    setAdding("tire");
  };

  const startEditTire = (tire) => {
    setTireForm({
      brand: tire.brand,
      season: tire.season,
      cost: String(tire.cost ?? ""),
      initialOdometer: String(tire.initialOdometer ?? ""),
      retired: Boolean(tire.retired),
    });
    setEditingTireID(tire._id);
    setAdding("tire");
  };

  const usable = tires.filter((t) => !t.retired);
  // on the car, then stored sets, then retired ones; most recently used
  // first within each (sets never on the car count as newest)
  const group = (t) => (t.active ? 0 : t.retired ? 2 : 1);
  const lastUsed = (t) => (t.lastDate ? new Date(t.lastDate).getTime() : Infinity);
  const sorted = [...tires].sort((a, b) => group(a) - group(b) || lastUsed(b) - lastUsed(a));
  const editingTire = tires.find((t) => t._id === editingTireID);

  const startChange = () => {
    const off = usable.find((t) => !t.active);
    setChangeForm({
      tireID: off?._id || usable[0]?._id || "",
      odometer: String(Math.round(vehicle.odometer || 0)),
      date: format(new Date(), "yyyy-MM-dd"),
      retire: [],
    });
    setAdding("change");
  };

  const submitTire = (e) => {
    e.preventDefault();
    saveTire({
      variables: {
        budgetID,
        input: {
          vehicleID: vehicle._id,
          ...(editingTireID ? { tireID: editingTireID, retired: tireForm.retired } : {}),
          brand: tireForm.brand,
          season: tireForm.season,
          cost: Number(tireForm.cost) || 0,
          initialOdometer: Number(tireForm.initialOdometer) || 0,
        },
      },
    });
  };

  const submitChange = (e) => {
    e.preventDefault();
    addChange({
      variables: {
        input: {
          budgetID,
          vehicleID: vehicle._id,
          tireID: changeForm.tireID,
          odometer: Number(changeForm.odometer),
          date: dateInputToEffectiveDate(changeForm.date) || toEffectiveDate(new Date()),
          retireTireIDs: changeForm.retire,
        },
      },
    });
  };

  const tireByID = new Map(tires.map((t) => [t._id, t]));
  const newestFirst = [...changes].reverse();
  const openChange = changes.find((c) => c._id === openChangeID);

  return (
    <section className="card tires-card">
      <div className="card-header">
        <h2 className="card-title">Tires</h2>
        <div className="tires-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={startAddTire}>
            <FiPlus /> Add tires
          </button>
          {usable.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => (adding === "change" ? setAdding(null) : startChange())}>
              <FiRepeat /> Log change
            </button>
          )}
        </div>
      </div>

      {errorState && !openChange && (
        <div className="banner banner-error tires-banner" role="alert">
          {errorState}
        </div>
      )}

      {adding === "tire" && (
        <form className="vehicle-form tires-form" onSubmit={submitTire} autoComplete="off">
          <div className="vehicle-form-grid">
            <label className="tires-wide">
              Tires
              <input value={tireForm.brand} placeholder="Michelin Pilot Sport 4S" onChange={(e) => setTireForm({ ...tireForm, brand: e.target.value })} />
            </label>
            <SeasonPicker value={tireForm.season} onChange={(season) => setTireForm({ ...tireForm, season })} />
            <label>
              Cost
              <input inputMode="decimal" value={tireForm.cost} placeholder="0.00" onChange={(e) => setTireForm({ ...tireForm, cost: e.target.value.replace(/[^\d.]/g, "") })} />
            </label>
            <label>
              km already on them
              <input inputMode="decimal" value={tireForm.initialOdometer} placeholder="0" onChange={(e) => setTireForm({ ...tireForm, initialOdometer: e.target.value.replace(/[^\d.]/g, "") })} />
            </label>
          </div>
          {editingTire && !editingTire.active && editingTire.installs > 0 && (
            <label className="tire-retire-option tire-retired-toggle">
              <input
                type="checkbox"
                checked={tireForm.retired}
                onChange={(e) => setTireForm({ ...tireForm, retired: e.target.checked })}
              />
              Retired: done with these tires
            </label>
          )}
          <div className="vehicle-form-actions">
            {editingTire && editingTire.installs === 0 && (
              <button
                type="button"
                className="btn btn-secondary tires-delete"
                onClick={() => deleteTire({ variables: { budgetID, tireID: editingTire._id } })}
              >
                <FiTrash2 /> Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!tireForm.brand.trim() || savingTire}>
              {editingTireID ? "Save tires" : "Add tires"}
            </button>
          </div>
        </form>
      )}

      {adding === "change" && changeForm && (
        <form className="vehicle-form tires-form" onSubmit={submitChange} autoComplete="off">
          <div className="vehicle-form-grid">
            <label className="tires-wide">
              Tires going on
              <select value={changeForm.tireID} onChange={(e) => setChangeForm({ ...changeForm, tireID: e.target.value, retire: changeForm.retire.filter((id) => id !== e.target.value) })}>
                {usable.map((t) => (
                  <option key={t._id} value={t._id}>
                    {tireOptionLabel(t)}
                    {t.active ? " - on now" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Odometer
              <input inputMode="decimal" value={changeForm.odometer} onChange={(e) => setChangeForm({ ...changeForm, odometer: e.target.value.replace(/[^\d.]/g, "") })} />
            </label>
            <label>
              Date
              <input type="date" value={changeForm.date} onChange={(e) => setChangeForm({ ...changeForm, date: e.target.value })} />
            </label>
          </div>
          <RetirePicker
            tires={usable.filter((t) => t._id !== changeForm.tireID)}
            value={changeForm.retire}
            onChange={(retire) => setChangeForm({ ...changeForm, retire })}
          />
          <div className="vehicle-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!changeForm.tireID || changeForm.odometer === "" || savingChange}>Log change</button>
          </div>
        </form>
      )}

      {tires.length === 0 ? (
        <p className="empty-state">No tires yet. Add the sets this vehicle uses, then log when they go on.</p>
      ) : (
        <div className="table-scroll">
          <table className="fuel-table tires-table">
            <thead>
              <tr>
                <th>Tires</th>
                <th className="hide-sm">Status</th>
                <th className="num">Tire km</th>
                <th className="num">Cost</th>
                <th className="num">$/100 km</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr
                  key={t._id}
                  className={`${t.active ? "tire-active" : ""}${t.retired ? " tire-retired" : ""}${editingTireID === t._id ? " tire-editing" : ""}`}
                  onClick={() => startEditTire(t)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && startEditTire(t)}
                  title="Edit these tires"
                >
                  <td>
                    <span className="tire-name">
                      <SeasonIcon season={t.season} />
                      <span>{tireLabel(t)}</span>
                    </span>
                  </td>
                  <td className="hide-sm">
                    {t.active ? <span className="badge badge-accent">On the car</span> : t.retired ? "Retired" : "Stored"}
                  </td>
                  <td className="num" title={t.initialOdometer ? `${Math.round(t.initialOdometer).toLocaleString("en-US")} km already on them when bought` : undefined}>
                    {t.active ? "≈ " : ""}
                    {Math.round(t.mileage).toLocaleString("en-US")}
                  </td>
                  <td className="num">{toCurrency(t.cost)}</td>
                  <td className="num strong">{t.costPer100km != null ? toCurrency(t.costPer100km) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {changes.length > 0 && (
        <details className="tire-changes">
          <summary>
            {changes.length} tire change{changes.length === 1 ? "" : "s"}
          </summary>
          <div className="table-scroll">
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Odometer</th>
                  <th className="tire-col">On</th>
                  <th className="tire-col hide-sm">Retired</th>
                </tr>
              </thead>
              <tbody>
                {newestFirst.map((c) => {
                  const tire = tireByID.get(c.tireID);
                  return (
                    <tr
                      key={c._id}
                      onClick={() => setOpenChangeID(c._id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setOpenChangeID(c._id)}
                    >
                      <td title={c.dateEstimated ? "Estimated from the odometer" : undefined}>
                        {c.dateEstimated ? "≈ " : ""}
                        {format(new Date(c.date), "MMM d, yyyy")}
                      </td>
                      <td className="num muted">{Math.round(c.odometer).toLocaleString("en-US")}</td>
                      <td className="tire-col">
                        <span className="tire-name">
                          {tire && <SeasonIcon season={tire.season} />}
                          <span>{tire ? tireLabel(tire) : "?"}</span>
                        </span>
                      </td>
                      <td className="tire-col hide-sm muted">
                        {(c.retired || [])
                          .map((id) => tireByID.get(id))
                          .filter(Boolean)
                          .map((t) => tireLabel(t))
                          .join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {openChange && (
        <TireChangeModal
          change={openChange}
          tireByID={tireByID}
          record={records.find((r) => r._id === openChange.entryID)}
          error={errorState}
          busy={updatingChange || deletingChange}
          onClose={() => {
            setOpenChangeID(null);
            setErrorState(null);
          }}
          onSave={(changes) =>
            updateChange({
              variables: {
                input: {
                  budgetID,
                  vehicleID: vehicle._id,
                  changeID: openChange._id,
                  ...changes,
                },
              },
            })
          }
          onDelete={() =>
            deleteChange({ variables: { budgetID, vehicleID: vehicle._id, changeID: openChange._id } })
          }
        />
      )}
    </section>
  );
}

// a tire change's details, like a transaction's: edit it, or delete it
function TireChangeModal({ change, tireByID, record, error, busy, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const originalDate = format(new Date(change.date), "yyyy-MM-dd");
  const [form, setForm] = useState({
    odometer: String(change.odometer),
    date: originalDate,
    tireID: change.tireID,
  });

  // close on Escape
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const tire = tireByID.get(change.tireID);
  const retired = (change.retired || []).map((id) => tireByID.get(id)).filter(Boolean);
  const linked = Boolean(change.entryID);

  return (
    <div className="modal-pane" role="dialog" aria-modal="true">
      <div className="modal-bg" onClick={onClose}></div>
      <div className="modal-window">
        <div className="modal-header">
          <span className="modal-eyebrow">Tire change</span>
          <button type="button" className="icon-button icon-button-sm" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <h2 className="modal-title tire-name">
          {tire && <SeasonIcon season={tire.season} />}
          <span>{tire ? tireLabel(tire) : "?"}</span>
        </h2>

        {editing ? (
          <form
            className="vehicle-form-grid tire-change-form"
            onSubmit={(e) => {
              e.preventDefault();
              // only what changed: an untouched date stays as it is (estimated or not)
              onSave({
                odometer: Number(form.odometer),
                ...(form.date !== originalDate ? { date: dateInputToEffectiveDate(form.date) } : {}),
                ...(form.tireID !== change.tireID ? { tireID: form.tireID } : {}),
              });
            }}
          >
            <label className="tires-wide">
              Tires going on
              <select value={form.tireID} onChange={(e) => setForm({ ...form, tireID: e.target.value })}>
                {[...tireByID.values()].map((t) => (
                  <option key={t._id} value={t._id}>
                    {tireOptionLabel(t)}
                    {t.retired ? " - retired" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Odometer
              <input
                inputMode="decimal"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value.replace(/[^\d.]/g, "") })}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <div className="modal-actions tires-wide">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={form.odometer === "" || busy}>
                Save change
              </button>
            </div>
          </form>
        ) : (
          <dl className="detail-list">
            <dt>Date</dt>
            <dd>
              {format(new Date(change.date), "MMM d, yyyy")}
              {change.dateEstimated ? " (estimated)" : ""}
            </dd>
            <dt>Odometer</dt>
            <dd>{formatKm(change.odometer)}</dd>
            {retired.length > 0 && (
              <>
                <dt>Retired</dt>
                <dd>{retired.map((t) => tireLabel(t)).join(", ")}</dd>
              </>
            )}
            {linked && (
              <>
                <dt>Logged with</dt>
                <dd>{record ? record.title : "a maintenance record"}</dd>
              </>
            )}
          </dl>
        )}

        {error && (
          <div className="banner banner-error modal-banner" role="alert">
            {error}
          </div>
        )}

        {!editing &&
          (confirmingDelete ? (
            <div className="modal-confirm">
              <p>
                Delete this tire change?
                {retired.length ? " The tires it retired come back." : ""}
                {linked ? " The maintenance record stays." : ""}
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Keep it
                </button>
                <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Edit change
                </button>
              </div>
              <button type="button" className="modal-delete" onClick={() => setConfirmingDelete(true)}>
                <FiTrash2 aria-hidden="true" />
                Delete change
              </button>
            </>
          ))}
      </div>
    </div>
  );
}

export const SeasonPicker = ({ value, onChange }) => (
  <div className="tire-season">
    <span className="tire-season-label">Season</span>
    <div className="segmented" role="radiogroup" aria-label="Season">
      {SEASONS.map(({ value: season, label, icon: Icon }) => (
        <button
          key={season}
          type="button"
          role="radio"
          aria-checked={value === season}
          className={`segmented-option${value === season ? " segmented-active" : ""}`}
          onClick={() => onChange(season)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  </div>
);

// sets coming off for good at a change
export const RetirePicker = ({ tires, value, onChange }) =>
  tires.length > 0 && (
    <fieldset className="tire-retire">
      <legend>Retire at this change</legend>
      {tires.map((t) => (
        <label key={t._id} className="tire-retire-option">
          <input
            type="checkbox"
            checked={value.includes(t._id)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, t._id] : value.filter((id) => id !== t._id))
            }
          />
          <SeasonIcon season={t.season} />
          {tireLabel(t)}
        </label>
      ))}
    </fieldset>
  );
