import React from "react";

// Picks the vehicle an entry's details belong to. "No vehicle" is always on
// offer so details can be taken off an entry while editing it.
const VehicleSelect = ({ value, vehicles, userID, onChange }) => (
  <label className="fuel-field fuel-field-wide">
    <span>Vehicle</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No vehicle</option>
      {vehicles.map((v) => (
        <option key={v._id} value={v._id}>
          {v.name}
          {v.plate ? ` (${v.plate})` : ""}
          {v.defaultFor?.includes(userID) ? " - default" : ""}
        </option>
      ))}
    </select>
  </label>
);

export default VehicleSelect;
