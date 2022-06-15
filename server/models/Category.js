const { Schema, model } = require('mongoose');

const categoryRangeSchema = new Schema(
  {
    order: {  
      type: Number,
      required: true
    },
    effectiveStartDate: {
      type: Date,
      required: true
    },
    effectiveEndDate: {
      type: Date
    },
    budgetedValue: {
      type: Number,
      required: "Value required"
    },
  },
)

const categorySchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    categoryType: {
      type: String,
      enums: [ 'income','expense' ],
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
    budgetedValueRange: [ categoryRangeSchema ]
  },
)

const Category = model( 'Category', categorySchema );

module.exports = Category;
