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
  status: {
    type: String,
    enum: ['completed', 'pending', 'waiting', 'rejected']
  },
  notes: Array({
    note: String,
    status: {
      type: String,
      enum: ['completed', 'pending', 'waiting', 'rejected']
    }
  })
})

module.exports = mongoose.model('Request', RequestSchema)
