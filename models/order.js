const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    _customer: {
      type: 'ObjectId',
      required: true
    },
    _trip: {
      type: 'ObjectId',
      required: true
    },
    type: {
      type: String,
      enum: ['flight', 'hotel'],
      required: true
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'completed', 'failed', 'cancelling', 'cancelled']
    },
    customerCode: String,
    number: String,
    currency: String,
    total: Number
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Order', OrderSchema)
