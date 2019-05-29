const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    _customer: {
      type: 'ObjectId',
      required: true,
      ref: 'User'
    },
    _trip: {
      type: 'ObjectId',
      required: true,
      ref: 'Trip'
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
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelling',
        'cancelled'
      ]
    },
    customerCode: String,
    number: String,
    cancelNumber: String,
    currency: String,
    total: Number,
    flight: {},
    hotel: {},
    rejectedReason: String, // rejected reason for cancellation
    pnr: String,
    canCancel: Boolean
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Order', OrderSchema)
