const { Schema, model } = require('mongoose');

const entrySchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      required: "Title required"
    },
    value: {
      type: Number,
      required: "Value required"
    },
    budgetID: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
    },
    categoryID: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }
  },
)

const Entry = model( 'Entry', entrySchema );

module.exports = Entry;
