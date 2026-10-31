import React from "react";
import { FiRepeat } from "react-icons/fi";
import { SeasonPicker, RetirePicker, tireOptionLabel } from "../../views/vehicleTires";
import { cleanDecimal, toNumber } from "./FuelDetailsInput";

// form state for a tire change logged with a maintenance record
export const emptyTires = {
  enabled: false,
  mode: "existing",
  tireID: "",
  brand: "",
  season: "summer",
  cost: "",
  initialOdometer: "",
  retire: [],
};

export function tiresFromEntry(tireChange) {
  if (!tireChange) {
    return emptyTires;
  }
  return {
    ...emptyTires,
    enabled: true,
    tireID: tireChange.tireID,
    retire: tireChange.retireTireIDs || [],
  };
}

// the EntryTireChangeInput to send, or null when there's no tire change
export function tiresForSubmit(tires) {
  if (!tires?.enabled) {
    return null;
  }
  const retireTireIDs = tires.retire.filter((id) => id !== tires.tireID);
  if (tires.mode === "new") {
    return {
      newTire: {
        brand: tires.brand.trim(),
        season: tires.season,
        cost: toNumber(tires.cost) ?? 0,
        initialOdometer: toNumber(tires.initialOdometer) ?? 0,
      },
      retireTireIDs,
    };
  }
  return tires.tireID ? { tireID: tires.tireID, retireTireIDs } : null;
}

// a description mentioning tires offers the tire change
export const mentionsTires = (text) => /tire/i.test(text || "");

const TireChangeInput = ({ input, setInput, vehicles = [], prop = "tires", serviceProp = "service", valueProp = "value" }) => {
  const tires = input[prop] || emptyTires;
  const service = input[serviceProp] || {};
  const vehicle = vehicles.find((v) => v._id === service.vehicleID);
  if (!service.enabled || !vehicle || !(mentionsTires(input.title) || tires.enabled)) {
    return null;
  }

  const usable = (vehicle.tires || []).filter((t) => !t.retired || t._id === tires.tireID);
  const update = (changes) => setInput({ ...input, [prop]: { ...tires, ...changes } });

  const toggle = () => {
    if (tires.enabled) {
      update({ enabled: false });
      return;
    }
    // suggest the set that's off the car, or a new set if there are none
    const off = usable.find((t) => !t.active && !t.retired);
    update({
      enabled: true,
      mode: off || tires.tireID ? "existing" : "new",
      tireID: tires.tireID || off?._id || "",
      cost: tires.cost || (input[valueProp] ? String(input[valueProp]) : ""),
    });
  };

  const goingOn = tires.mode === "existing" ? tires.tireID : null;
  const odometer = toNumber(service.odometer);

  return (
    <div className={`fuel-panel tire-change-panel${tires.enabled ? " fuel-panel-open" : ""}`}>
      <div className="fuel-head">
        <span className="fuel-title">
          <FiRepeat aria-hidden="true" /> Changing tires?
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={tires.enabled}
          className={`switch${tires.enabled ? " switch-on" : ""}`}
          onClick={toggle}
        >
          <span className="switch-knob" />
          <span className="sr-only">Log a tire change</span>
        </button>
      </div>

      {tires.enabled && (
        <div className="fuel-body tire-change-body">
          <div className="segmented fuel-field-wide" role="radiogroup" aria-label="Which tires">
            {[
              ["existing", "A set we have"],
              ["new", "New set"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={tires.mode === mode}
                className={`segmented-option${tires.mode === mode ? " segmented-active" : ""}`}
                onClick={() => update({ mode })}
                disabled={mode === "existing" && !usable.length}
              >
                {label}
              </button>
            ))}
          </div>

          {tires.mode === "existing" ? (
            <label className="fuel-field fuel-field-wide">
              <span>Tires going on</span>
              <select value={tires.tireID} onChange={(e) => update({ tireID: e.target.value })}>
                <option value="" disabled>
                  Choose tires
                </option>
                {usable.map((t) => (
                  <option key={t._id} value={t._id}>
                    {tireOptionLabel(t, vehicle.tires)}
                    {t.active ? " - on now" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="fuel-field fuel-field-wide">
                <span>Tires</span>
                <span className="fuel-input">
                  <input
                    name="tireBrand"
                    value={tires.brand}
                    placeholder="Michelin Pilot Sport 4S"
                    onChange={(e) => update({ brand: e.target.value })}
                  />
                </span>
              </label>
              <div className="fuel-field-wide">
                <SeasonPicker value={tires.season} onChange={(season) => update({ season })} />
              </div>
              <label className="fuel-field">
                <span>Cost</span>
                <span className="fuel-input">
                  <input
                    name="tireCost"
                    inputMode="decimal"
                    value={tires.cost}
                    placeholder="0.00"
                    onChange={(e) => update({ cost: cleanDecimal(e.target.value, 2) })}
                  />
                  <span className="fuel-suffix">$</span>
                </span>
              </label>
              <label className="fuel-field">
                <span>Already driven</span>
                <span className="fuel-input">
                  <input
                    name="tireKm"
                    inputMode="decimal"
                    value={tires.initialOdometer}
                    placeholder="0"
                    onChange={(e) => update({ initialOdometer: cleanDecimal(e.target.value, 0) })}
                  />
                  <span className="fuel-suffix">km</span>
                </span>
              </label>
            </>
          )}

          <div className="fuel-field-wide">
            <RetirePicker
              tires={usable.filter((t) => !t.retired && t._id !== goingOn)}
              all={vehicle.tires}
              value={tires.retire}
              onChange={(retire) => update({ retire })}
            />
          </div>
          <div className="fuel-summary">
            <span>
              {odometer !== null
                ? `Changes over at ${Math.round(odometer).toLocaleString("en-US")} km on this record's date.`
                : "Enter the odometer reading above to log the change."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TireChangeInput;
