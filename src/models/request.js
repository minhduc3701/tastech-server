const mongoose = require('mongoose')

const { Schema } = mongoose

const RequestSchema = new Schema({
  email: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  company: { type: String },
  role: { type: String },
  numberOfEmployees: { type: String },
  country: { type: String },
  referral: { type: String },
  status: {
    type: String,
    enum: ['completed', 'pending', 'waiting', 'rejected'],
    default: 'waiting'
  },
  notes: Array({
    note: String,
    status: {
      type: String,
      enum: ['completed', 'pending', 'rejected']
    }
  })
})

module.exports = mongoose.model('Request', RequestSchema)
