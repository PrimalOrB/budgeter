// Checks for the numbers on fuel and maintenance details. Each field is
// "required" (empty), "invalid" (not a sensible value) or "valid"; the form
// can only be sent when every field it shows is valid.

// [lowest, highest, what a value outside usually means]
const LIMITS = {
  pricePerLitre: [0.3, 5, "Over $5/L: entered in cents? e.g. 1.879"],
  litres: [0.1, 150, "More than a tank: swapped with km?"],
  distance: [1, 2000, "Over 2,000 km on one tank: swapped with litres?"],
  odometer: [0, 2000000, "Check the reading"],
};

const asNumber = (text) => (text === "" || text === null || text === undefined ? null : Number(text));

export function fieldState(name, text) {
  const value = asNumber(text);
  if (value === null) {
    return "required";
  }
  const [low, high] = LIMITS[name];
  return Number.isFinite(value) && value >= low && value <= high ? "valid" : "invalid";
}

export function fieldHint(name, text) {
  const value = asNumber(text);
  if (value === null || fieldState(name, text) !== "invalid") {
    return null;
  }
  const [low, , tooHigh] = LIMITS[name];
  return value < low ? `Must be at least ${low}` : tooHigh;
}

// fuel details are ready to send when off, or when every number is valid
export function fuelReady(fuel) {
  if (!fuel?.enabled) {
    return true;
  }
  return (
    Boolean(fuel.vehicleID) &&
    ["pricePerLitre", "litres", "distance"].every((name) => fieldState(name, fuel[name]) === "valid")
  );
}

export function maintenanceReady(service) {
  if (!service?.enabled) {
    return true;
  }
  return Boolean(service.vehicleID) && fieldState("odometer", service.odometer) === "valid";
}
