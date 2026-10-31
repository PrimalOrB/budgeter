const { Schema, model } = require('mongoose');

// a switch to a set of tires at an odometer reading; the set stays on the
// vehicle until the next change
const tireChangeSchema = new Schema(
  {
    odometer: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    // the date was worked out from the odometer rather than recorded
    dateEstimated: { type: Boolean, default: false },
    tireID: { type: Schema.Types.ObjectId, ref: 'Tire', required: true },
    // tires retired at this change, so undoing it can bring them back
    retired: [ { type: Schema.Types.ObjectId, ref: 'Tire' } ],
    // the maintenance entry that logged the change, if any
    entryID: { type: Schema.Types.ObjectId, ref: 'Entry' },
  }
);

// Vehicles belong to a budget but are their own documents. The odometer is
// offset + every km logged against the vehicle, so editing a fill-up keeps
// it current.
const vehicleSchema = new Schema(
  {
    budgetID: { type: Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
    make: { type: String, trim: true, required: true },
    model: { type: String, trim: true, required: true },
    year: { type: Number, min: 1900, max: 2100 },
    plate: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    odometerOffset: { type: Number, default: 0 },
    // owners who use this as their default vehicle when logging fuel
    defaultFor: [ { type: Schema.Types.ObjectId, ref: 'User' } ],
    tireChanges: [ tireChangeSchema ],
  },
  { timestamps: true }
);

const Vehicle = model('Vehicle', vehicleSchema);

module.exports = Vehicle;
