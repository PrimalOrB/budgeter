import React from "react";
import { FiTool } from "react-icons/fi";
import VehicleSelect from "./VehicleSelect";
import { cleanDecimal, toNumber, defaultVehicleID } from "./FuelDetailsInput";
import { fieldState, fieldHint } from "./vehicleChecks";

// form state for the optional maintenance details, as strings while typing
export const emptyMaintenance = { enabled: false, vehicleID: "", odometer: "" };

export function maintenanceFromEntry(maintenance) {
  if (!maintenance) {
    return emptyMaintenance;
  }
  return {
    enabled: true,
    vehicleID: maintenance.vehicleID,
    odometer:
      maintenance.odometer === null || maintenance.odometer === undefined
        ? ""
        : String(maintenance.odometer),
  };
}

// the MaintenanceInput to send, or null when details are off
export function maintenanceForSubmit(details) {
  if (!details?.enabled || !details.vehicleID) {
    return null;
  }
  return { vehicleID: details.vehicleID, odometer: toNumber(details.odometer) };
}

const currentReading = (vehicles, vehicleID) => {
  const reading = vehicles.find((v) => v._id === vehicleID)?.odometer;
  return reading ? String(Math.round(reading)) : "";
};

const MaintenanceDetailsInput = ({ input, setInput, vehicles = [], prop = "service" }) => {
  const details = input[prop] || emptyMaintenance;
  const update = (changes) => setInput({ ...input, [prop]: { ...details, ...changes } });

  // a new record starts from the vehicle's current reading
  const pickVehicle = (vehicleID) => {
    if (!vehicleID) {
      update({ enabled: false, vehicleID: "" });
      return;
    }
    update({ vehicleID, odometer: details.odometer || currentReading(vehicles, vehicleID) });
  };

  const toggle = () => {
    if (details.enabled) {
      update({ enabled: false });
      return;
    }
    const vehicleID = details.vehicleID || defaultVehicleID(vehicles, input.userID);
    update({
      enabled: true,
      vehicleID,
      odometer: details.odometer || currentReading(vehicles, vehicleID),
    });
  };

  if (!vehicles.length) {
    return (
      <div className="fuel-panel fuel-panel-empty">
        <FiTool aria-hidden="true" />
        <span>Add a vehicle in Settings to link maintenance to it.</span>
      </div>
    );
  }

  const latest = currentReading(vehicles, details.vehicleID);

  return (
    <div className={`fuel-panel${details.enabled ? " fuel-panel-open" : ""}`}>
      <div className="fuel-head">
        <span className="fuel-title">
          <FiTool aria-hidden="true" /> Vehicle details
          <span className="fuel-optional">optional</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={details.enabled}
          className={`switch${details.enabled ? " switch-on" : ""}`}
          onClick={toggle}
        >
          <span className="switch-knob" />
          <span className="sr-only">Link to a vehicle</span>
        </button>
      </div>

      {details.enabled && (
        <div className="fuel-body">
          <VehicleSelect
            value={details.vehicleID}
            vehicles={vehicles}
            userID={input.userID}
            onChange={pickVehicle}
          />
          <label className="fuel-field fuel-field-wide">
            <span>Odometer</span>
            <span className={`fuel-input field-${fieldState("odometer", details.odometer)}`}>
              <input
                name="odometer"
                inputMode="decimal"
                value={details.odometer}
                placeholder={latest || "85000"}
                onChange={(e) => update({ odometer: cleanDecimal(e.target.value, 1) })}
              />
              <span className="fuel-suffix">km</span>
            </span>
            {fieldHint("odometer", details.odometer) && (
              <span className="field-hint">{fieldHint("odometer", details.odometer)}</span>
            )}
          </label>
          {latest && (
            <div className="fuel-summary">
              <span>Latest reading from fill-ups: {Number(latest).toLocaleString("en-US")} km</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaintenanceDetailsInput;
