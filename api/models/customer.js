const mongoose = require('mongoose');

const { Schema } = mongoose;

const customerSchema = new Schema({
  stripeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  }
});
