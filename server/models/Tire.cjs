const { Schema, model } = require('mongoose');

// a set of tires for one vehicle; when it's on the car comes from the
// vehicle's tire changes
const tireSchema = new Schema(
  {
    vehicleID: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    // e.g. "Michelin Pilot Sport 4S"
    brand: { type: String, trim: true, required: true },
    season: { type: String, enum: [ 'summer', 'winter', 'all-season' ], default: 'summer' },
    cost: { type: Number, min: 0, default: 0 },
    // km already on the tires when they were bought
    initialOdometer: { type: Number, min: 0, default: 0 },
    retired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Tire = model('Tire', tireSchema);

module.exports = Tire;
