const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TicketSchema = new Schema({
  orderNum: {
    type: String,
    required: true
  },
  airPnr: {
    type: String,
    required: true
  },
  paymentGate: {
    type: String,
    required: true
  },
  serialNum: {
    type: String,
    required: true
  },
  merchantOrder: {
    type: String,
    required: true
  },
  permitVoid: {
    type: Number,
    required: true
  },
  lastVoidTime: {
    type: String,
    required: true
  },
  voidServiceFee: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  ticketNums: Array({
    ticketNum: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    cardType: {
      type: String,
      required: true
    },
    cardNum: {
      type: String,
      required: true
    }
  })
})

module.exports = mongoose.model('Ticket', TicketSchema)
