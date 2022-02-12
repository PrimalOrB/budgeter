const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const User = model( 'User', userSchema );

module.exports = User;
