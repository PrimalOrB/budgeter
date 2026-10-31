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
