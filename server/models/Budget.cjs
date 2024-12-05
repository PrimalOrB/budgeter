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
    }]
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const Budget = model( 'Budget', budgetSchema );

module.exports = Budget;
