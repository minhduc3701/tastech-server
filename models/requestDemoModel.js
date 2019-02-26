const mongoose = require('mongoose');

const { Schema } = mongoose;

const requestDemoModel = new Schema(
  {
    email: { type: String },
    fname: { type: String },
    lname: { type: String },
    phone: { type: String },
    company: { type: String },
    role: { type: String },
    NoE: { type: String },
    country: { type: String },
  },
);

module.exports = mongoose.model('Request', requestDemoModel);
