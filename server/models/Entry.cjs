const { Schema, model } = require('mongoose');
const { dateToMonthStr } = require("../utils/helpers.cjs");

const entrySchema = new Schema(
  {
    // date the entry applies to - editable, drives monthString
    effectiveDate: {
      type: Date,
      required: "Effective date required",
      default: Date.now,
    },
    monthString: {
      type: String,
      // must be a function, otherwise evaluated once at server start
      default: function () {
        return dateToMonthStr(this.effectiveDate || new Date());
      },
    },
    // description for income/expense; an optional note for transfers
    title: {
      type: String,
      trim: true,
      default: "",
      required: [
        function () {
          // update validators run with the query as `this`; resolvers check
          // descriptions on edit, so only enforce on documents
          if (typeof this.getUpdate === "function") {
            return false;
          }
          return this.valueType !== "transfer";
        },
        "Title required",
      ],
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
  {
    // createdAt (immutable, when the record was made) + updatedAt
    timestamps: true,
  }
)

entrySchema.index({ budgetID: 1, monthString: 1 });
entrySchema.index({ budgetID: 1, effectiveDate: -1 });

const Entry = model( 'Entry', entrySchema );

module.exports = Entry;
