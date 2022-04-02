const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      required: "Title required"
    },
    effectiveStartDate: {
      type: Date,
      default: Date.now,
    },
    effectiveEndDate: {
      type: Date
    },
    budgetedValue: {
      type: Number,
      required: "Value required"
    },
    budgetID: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
    },
  },
)

const Category = model( 'Category', categorySchema );

module.exports = Category;
