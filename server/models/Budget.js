const { Schema, model } = require('mongoose');

const budgetLineSchema = new Schema(
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
    }
  },
)

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
    lines: [ budgetLineSchema ]
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const Budget = model( 'Budget', budgetSchema );

module.exports = Budget;
