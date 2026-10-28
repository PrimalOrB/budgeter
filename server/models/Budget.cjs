const { Schema, model } = require('mongoose');

const budgetSchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ownerIDs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: 'User ID Required'
      }
    ],    
    title: {
      type: String,
      required: true
    },
    desc: {
      type: String,
      required: true
    },
    categories: [ {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    } ],
    entries: [ {
      type: Schema.Types.ObjectId,
      ref: 'Entry',
    }],
    // vehicles for mileage tracking; the odometer is offset + every km logged
    // against the vehicle, so editing a fill-up keeps it current
    vehicles: [ {
      make: { type: String, trim: true, required: true },
      model: { type: String, trim: true, required: true },
      year: { type: Number, min: 1900, max: 2100 },
      plate: { type: String, trim: true, default: "" },
      color: { type: String, trim: true, default: "" },
      odometerOffset: { type: Number, default: 0 },
      // owners who use this as their default vehicle when logging fuel
      defaultFor: [ { type: Schema.Types.ObjectId, ref: 'User' } ],
    } ],
    // how shared expenses are divided, changeable month over month; each
    // setting applies from effectiveMonth until the next one
    splitSettings: [ {
      effectiveMonth: {
        type: String,
        required: true,
        match: /^\d{4}-(0[1-9]|1[0-2])$/,
      },
      method: {
        type: String,
        enum: [ 'proportional', 'percentage' ],
        required: true,
        default: 'proportional',
      },
      shares: [ {
        _id: false,
        userID: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        percent: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
      } ],
    } ],
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const Budget = model( 'Budget', budgetSchema );

module.exports = Budget;
