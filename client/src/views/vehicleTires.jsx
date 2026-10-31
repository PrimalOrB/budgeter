import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { format } from "date-fns";
import { LuSun, LuSnowflake, LuCloudSun } from "react-icons/lu";
import { FiPlus, FiTrash2, FiRepeat } from "react-icons/fi";
import { SAVE_TIRE, DELETE_TIRE, ADD_TIRE_CHANGE, DELETE_TIRE_CHANGE } from "../utils/mutations";
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
export function tireOptionLabel(tire, tires = []) {
  return `${seasonOf(tire.season).glyph} ${tireLabel(tire, tires)}`;
}

// "Michelin Pilot Sport 4S (2025)": the year the set first went on, when two
// sets share a name ("new" for a set that hasn't been on yet)
export function tireLabel(tire, tires = []) {
  const twins = tires.filter((t) => t.brand === tire.brand).length > 1;
  if (!twins) {
    return tire.brand;
  }
  return `${tire.brand} (${tire.firstDate ? new Date(tire.firstDate).getFullYear() : "new"})`;
}

const seasonColor = (colors, season) =>
  season === "winter" ? colors.winter : season === "summer" ? colors.summer : colors.muted;

// one row per set of tires, a bar for each time it was on the car
export function TireTimeline({ tires, stints, start, end, isNarrow }) {
  const shown = useMemo(() => {
    const ids = new Set(
      stints.filter((s) => s.toDate >= start && s.fromDate < end).map((s) => s.tireID)
    );
    return tires.filter((t) => ids.has(t._id));
  }, [tires, stints, start, end]);

  const colors = getChartColors();
  const labels = shown.map((t) => `${seasonOf(t.season).glyph}  ${tireLabel(t, tires)}`);
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

const blankTire = { brand: "", season: "summer", cost: "", initialOdometer: "" };

// the vehicle's tires: figures for each set, plus adding sets and changes
export function TiresCard({ budgetID, vehicle, tires, changes, refetch }) {
  const [adding, setAdding] = useState(null); // null, "tire" or "change"
  const [tireForm, setTireForm] = useState(blankTire);
  const [changeForm, setChangeForm] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const mutationOptions = {
    onCompleted: () => {
      setAdding(null);
      setErrorState(null);
      refetch();
    },
    onError: (err) => setErrorState(err.message),
  };
  const [saveTire, { loading: savingTire }] = useMutation(SAVE_TIRE, mutationOptions);
  const [deleteTire] = useMutation(DELETE_TIRE, mutationOptions);
  const [addChange, { loading: savingChange }] = useMutation(ADD_TIRE_CHANGE, mutationOptions);
  const [deleteChange] = useMutation(DELETE_TIRE_CHANGE, mutationOptions);

  const usable = tires.filter((t) => !t.retired);
  const sorted = [...tires].sort(
    (a, b) => Number(b.active) - Number(a.active) || Number(a.retired) - Number(b.retired)
  );

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

  return (
    <section className="card tires-card">
      <div className="card-header">
        <h2 className="card-title">Tires</h2>
        <div className="tires-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(adding === "tire" ? null : "tire")}>
            <FiPlus /> Add tires
          </button>
          {usable.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => (adding === "change" ? setAdding(null) : startChange())}>
              <FiRepeat /> Log change
            </button>
          )}
        </div>
      </div>

      {errorState && (
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
          <div className="vehicle-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!tireForm.brand.trim() || savingTire}>Add tires</button>
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
                    {tireOptionLabel(t, tires)}
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
            all={tires}
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
                <th className="num">km used</th>
                <th className="num hide-sm">Tire odometer</th>
                <th className="num">Cost</th>
                <th className="num">$/100 km</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t._id} className={`${t.active ? "tire-active" : ""}${t.retired ? " tire-retired" : ""}`}>
                  <td className="tire-name">
                    <SeasonIcon season={t.season} />
                    <span>{tireLabel(t, tires)}</span>
                  </td>
                  <td className="hide-sm">
                    {t.active ? <span className="badge badge-accent">On the car</span> : t.retired ? "Retired" : "Stored"}
                    {t.installs > 0 && <span className="tire-installs"> · {t.installs}×</span>}
                  </td>
                  <td className="num">{Math.round(t.usedKm).toLocaleString("en-US")}</td>
                  <td className="num hide-sm muted">
                    {t.active ? "≈ " : ""}
                    {Math.round(t.mileage).toLocaleString("en-US")}
                  </td>
                  <td className="num">{toCurrency(t.cost)}</td>
                  <td className="num strong">{t.costPer100km != null ? toCurrency(t.costPer100km) : "-"}</td>
                  <td className="row-actions">
                    {t.installs === 0 && (
                      <button type="button" className="icon-button icon-button-sm" aria-label={`Delete ${t.brand}`} onClick={() => deleteTire({ variables: { budgetID, tireID: t._id } })}>
                        <FiTrash2 />
                      </button>
                    )}
                    {t.installs > 0 && !t.active && (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          saveTire({
                            variables: {
                              budgetID,
                              input: { vehicleID: vehicle._id, tireID: t._id, brand: t.brand, season: t.season, cost: t.cost, initialOdometer: t.initialOdometer, retired: !t.retired },
                            },
                          })
                        }
                      >
                        {t.retired ? "Unretire" : "Retire"}
                      </button>
                    )}
                  </td>
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
                  <th className="wide">On</th>
                  <th className="hide-sm">Retired</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {newestFirst.map((c) => {
                  const tire = tireByID.get(c.tireID);
                  return (
                    <tr key={c._id}>
                      <td title={c.dateEstimated ? "Estimated from the odometer" : undefined}>
                        {c.dateEstimated ? "≈ " : ""}
                        {format(new Date(c.date), "MMM d, yyyy")}
                      </td>
                      <td className="num muted">{Math.round(c.odometer).toLocaleString("en-US")}</td>
                      <td className="wide tire-name">
                        {tire && <SeasonIcon season={tire.season} />}
                        <span>{tire ? tireLabel(tire, tires) : "?"}</span>
                      </td>
                      <td className="hide-sm muted">
                        {(c.retired || []).map((id) => tireByID.get(id)?.brand).filter(Boolean).join(", ")}
                      </td>
                      <td className="row-actions">
                        {!c.entryID && (
                          <button type="button" className="icon-button icon-button-sm" aria-label="Undo this tire change" onClick={() => deleteChange({ variables: { budgetID, vehicleID: vehicle._id, changeID: c._id } })}>
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
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
export const RetirePicker = ({ tires, all, value, onChange }) =>
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
          {tireLabel(t, all)}
        </label>
      ))}
    </fieldset>
  );
