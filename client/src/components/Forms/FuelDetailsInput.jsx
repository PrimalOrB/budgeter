import React from "react";
import { FiNavigation } from "react-icons/fi";
import { toCurrency } from "../../utils/helpers";

// form state for the optional fuel details, as strings while typing
export const emptyFuel = { enabled: false, vehicleID: "", pricePerLitre: "", litres: "", distance: "" };

export function fuelFromEntry(mileage) {
  if (!mileage) {
    return emptyFuel;
  }
  const text = (n) => (n === null || n === undefined ? "" : String(n));
  return {
    enabled: true,
    vehicleID: mileage.vehicleID,
    pricePerLitre: text(mileage.pricePerLitre),
    litres: text(mileage.litres),
    distance: text(mileage.distance),
  };
}

// pump receipts give price and litres to 3 decimals, trip meters km to 1
const DECIMALS = { pricePerLitre: 3, litres: 3, distance: 1 };

// digits and a single decimal point, cut to the field's precision
function cleanDecimal(text, places) {
  const [whole, ...rest] = text.replace(/[^\d.]/g, "").split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, places)}` : whole;
}

const toNumber = (text) => {
  if (text === "" || text === null || text === undefined) {
    return null;
  }
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// the MileageInput to send, or null when fuel details are off
export function fuelForSubmit(fuel) {
  if (!fuel?.enabled || !fuel.vehicleID) {
    return null;
  }
  return {
    vehicleID: fuel.vehicleID,
    pricePerLitre: toNumber(fuel.pricePerLitre),
    litres: toNumber(fuel.litres),
    distance: toNumber(fuel.distance),
  };
}

// the person's default vehicle, or the only vehicle there is
export function defaultVehicleID(vehicles = [], userID) {
  const mine = vehicles.find((v) => v.defaultFor?.includes(userID));
  return mine?._id || (vehicles.length === 1 ? vehicles[0]._id : "");
}

const FuelDetailsInput = ({ input, setInput, vehicles = [], prop = "fuel", valueProp = "value" }) => {
  const fuel = input[prop] || emptyFuel;

  const price = toNumber(fuel.pricePerLitre);
  const litres = toNumber(fuel.litres);
  const distance = toNumber(fuel.distance);
  const total = price !== null && litres !== null ? Math.round(price * litres * 100) / 100 : null;
  const efficiency = litres && distance ? (litres / distance) * 100 : null;

  // price x litres fills in the amount; it can still be edited afterwards
  const update = (changes) => {
    const next = { ...fuel, ...changes };
    const p = toNumber(next.pricePerLitre);
    const l = toNumber(next.litres);
    const recalc =
      ("pricePerLitre" in changes || "litres" in changes) && p !== null && l !== null;
    setInput({
      ...input,
      [prop]: next,
      ...(recalc ? { [valueProp]: Math.round(p * l * 100) / 100 } : {}),
    });
  };

  const toggle = () => {
    if (fuel.enabled) {
      update({ enabled: false });
      return;
    }
    update({
      enabled: true,
      vehicleID: fuel.vehicleID || defaultVehicleID(vehicles, input.userID),
    });
  };

  if (!vehicles.length) {
    return (
      <div className="fuel-panel fuel-panel-empty">
        <FiNavigation aria-hidden="true" />
        <span>Add a vehicle in Settings to log fuel details with this category.</span>
      </div>
    );
  }

  const field = (name, label, placeholder, suffix) => (
    <label className="fuel-field">
      <span>{label}</span>
      <span className="fuel-input">
        <input
          name={name}
          inputMode="decimal"
          value={fuel[name]}
          placeholder={placeholder}
          onChange={(e) => update({ [name]: cleanDecimal(e.target.value, DECIMALS[name]) })}
        />
        <span className="fuel-suffix">{suffix}</span>
      </span>
    </label>
  );

  return (
    <div className={`fuel-panel${fuel.enabled ? " fuel-panel-open" : ""}`}>
      <div className="fuel-head">
        <span className="fuel-title">
          <FiNavigation aria-hidden="true" /> Fuel details
          <span className="fuel-optional">optional</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={fuel.enabled}
          className={`switch${fuel.enabled ? " switch-on" : ""}`}
          onClick={toggle}
        >
          <span className="switch-knob" />
          <span className="sr-only">Include fuel details</span>
        </button>
      </div>

      {fuel.enabled && (
        <div className="fuel-body">
          <label className="fuel-field fuel-field-wide">
            <span>Vehicle</span>
            <select
              value={fuel.vehicleID}
              onChange={(e) => update({ vehicleID: e.target.value })}
            >
              <option value="" disabled>
                Choose a vehicle
              </option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                  {v.plate ? ` (${v.plate})` : ""}
                  {v.defaultFor?.includes(input.userID) ? " - default" : ""}
                </option>
              ))}
            </select>
          </label>
          {field("pricePerLitre", "Price", "1.999", "$/L")}
          {field("litres", "Litres", "52.418", "L")}
          {field("distance", "Distance", "450", "km")}
          <div className="fuel-summary">
            {total !== null ? (
              <span>
                {litres} L × ${price.toFixed(3)} = <strong>{toCurrency(total)}</strong>
                {input[valueProp] !== total && (
                  <button
                    type="button"
                    className="fuel-use-total"
                    onClick={() => setInput({ ...input, [valueProp]: total })}
                  >
                    Use as amount
                  </button>
                )}
              </span>
            ) : (
              <span>Enter price and litres to fill in the amount.</span>
            )}
            {efficiency !== null && (
              <span className="fuel-efficiency">{efficiency.toFixed(1)} L/100 km</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelDetailsInput;
