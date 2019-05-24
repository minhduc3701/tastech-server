const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    name: String,
    _customer: {
      type: 'ObjectId',
      required: true
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'completed', 'cancelling', 'cancelled']
    },
    code: String,
    orderNumber: String,
    flight: {},
    hotel: {},
    currency: String,
    total: Number
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Order', OrderSchema)
