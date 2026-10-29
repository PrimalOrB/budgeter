const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    categoryType: {
      type: String,
      enum: [ 'income','expense' ],
      required: true
    },
    title: {
      type: String,
      trim: true,
      required: "Title required"
    },
    budgetID: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
    },
    countUse: {
      type: Number,
      default: 0 
    },
    // optional extra data entries in this category can carry, e.g.
    // "mileage" lets fuel purchases record vehicle, litres and distance;
    // "maintenance" lets repairs and servicing record vehicle and odometer
    metaType: {
      type: String,
      enum: [ 'mileage', 'maintenance' ],
    },
  },
)

const Category = model( 'Category', categorySchema );

module.exports = Category;
