// Tire usage from a vehicle's tire changes. Each change puts a set of tires
// on at an odometer reading; it stays on until the next change, or up to the
// vehicle's current reading for the set on the car now.

// stints oldest first: { tireID, change, fromOdometer, toOdometer, fromDate, toDate, current }
function tireStints(changes = [], currentOdometer = 0, now = new Date()) {
  const sorted = [...changes].sort(
    (a, b) => a.odometer - b.odometer || new Date(a.date) - new Date(b.date)
  );
  return sorted.map((change, i) => {
    const next = sorted[i + 1];
    const toOdometer = next ? next.odometer : Math.max(change.odometer, currentOdometer);
    return {
      tireID: String(change.tireID),
      change,
      fromOdometer: change.odometer,
      toOdometer,
      km: Math.max(0, toOdometer - change.odometer),
      fromDate: new Date(change.date),
      toDate: next ? new Date(next.date) : now,
      current: !next,
    };
  });
}

// per-tire figures: km used on this vehicle, the tires' own odometer, cost
// per 100 km used, and whether they're on the car now
function tireSummary(tire, stints) {
  const own = stints.filter((s) => s.tireID === String(tire._id));
  const usedKm = own.reduce((total, s) => total + s.km, 0);
  const active = own.some((s) => s.current);
  return {
    usedKm,
    mileage: (tire.initialOdometer || 0) + usedKm,
    costPer100km: usedKm > 0 ? ((tire.cost || 0) / usedKm) * 100 : null,
    installs: own.length,
    active,
    firstDate: own[0]?.fromDate || null,
    lastDate: own.length ? own[own.length - 1].toDate : null,
  };
}

// the odometer at a date, between the readings either side of it; points are
// { date, odometer } oldest first, outside them the nearest is used
function odometerAt(points, date) {
  const time = new Date(date).getTime();
  if (!points.length) {
    return null;
  }
  const next = points.findIndex((p) => new Date(p.date).getTime() > time);
  if (next === 0) {
    return points[0].odometer;
  }
  if (next === -1) {
    return points[points.length - 1].odometer;
  }
  const a = points[next - 1];
  const b = points[next];
  const ta = new Date(a.date).getTime();
  const tb = new Date(b.date).getTime();
  const share = tb === ta ? 0 : (time - ta) / (tb - ta);
  return a.odometer + share * (b.odometer - a.odometer);
}

module.exports = { tireStints, tireSummary, odometerAt };
