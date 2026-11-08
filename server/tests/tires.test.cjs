const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { tireStints, tireSummary, odometerAt } = require("../utils/tires.cjs");

const changes = [
  { tireID: "winter", odometer: 20000, date: "2025-11-01" },
  { tireID: "summer", odometer: 10000, date: "2025-04-01" },
  { tireID: "summer", odometer: 25000, date: "2026-04-01" },
];
const now = new Date("2026-06-01");

describe("tireStints", () => {
  test("sorts by odometer and ends each stint at the next change", () => {
    const stints = tireStints(changes, 30000, now);
    assert.deepEqual(
      stints.map((s) => [s.tireID, s.fromOdometer, s.toOdometer, s.km, s.current]),
      [
        ["summer", 10000, 20000, 10000, false],
        ["winter", 20000, 25000, 5000, false],
        ["summer", 25000, 30000, 5000, true],
      ]
    );
    assert.equal(stints[2].toDate, now);
  });
  test("a current reading below the last change counts no km", () => {
    assert.equal(tireStints(changes, 0, now)[2].km, 0);
  });
  test("no changes gives no stints", () => {
    assert.deepEqual(tireStints(), []);
  });
});

describe("tireSummary", () => {
  const stints = tireStints(changes, 30000, now);
  test("adds up km across installs", () => {
    const s = tireSummary({ _id: "summer", initialOdometer: 1000, cost: 900 }, stints);
    assert.equal(s.usedKm, 15000);
    assert.equal(s.mileage, 16000);
    assert.equal(s.costPer100km, 6);
    assert.equal(s.installs, 2);
    assert.equal(s.active, true);
  });
  test("unused tires have no cost per km", () => {
    const s = tireSummary({ _id: "spare", cost: 500 }, stints);
    assert.equal(s.usedKm, 0);
    assert.equal(s.costPer100km, null);
    assert.equal(s.firstDate, null);
  });
});

describe("odometerAt", () => {
  const points = [
    { date: "2026-01-01", odometer: 1000 },
    { date: "2026-01-11", odometer: 2000 },
  ];
  test("interpolates between readings", () => {
    assert.equal(odometerAt(points, "2026-01-06"), 1500);
  });
  test("uses the nearest reading outside the range", () => {
    assert.equal(odometerAt(points, "2025-12-01"), 1000);
    assert.equal(odometerAt(points, "2026-02-01"), 2000);
  });
  test("no readings gives null", () => {
    assert.equal(odometerAt([], "2026-01-01"), null);
  });
});
