const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    userInitials: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 2
    },
    userColor: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    budgets: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Budget'
      }
    ],
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const User = model( 'User', userSchema );

module.exports = User;
