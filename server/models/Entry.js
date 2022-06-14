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
    valueType: {
      type: String,
      enum: ['expense','income','transfer'],
      required: true
    },
    budgetID: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
    },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    toUserID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    categoryID: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    individualEntry: {
      type: Boolean,
      default: false
    }
  },
)

const Entry = model( 'Entry', entrySchema );

module.exports = Entry;
