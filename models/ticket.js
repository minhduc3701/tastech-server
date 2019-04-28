const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TicketSchema = new Schema({
  orderNum: {
    type: String
  },
  airPnr: {
    type: String
  },
  paymentGate: {
    type: String
  },
  serialNum: {
    type: String
  },
  merchantOrder: {
    type: String
  },
  permitVoid: {
    type: Number
  },
  lastVoidTime: {
    type: String
  },
  voidServiceFee: {
    type: Number
  },
  currency: {
    type: String
  },
  ticketNums: Array({
    ticketNum: {
      type: String
    },
    lastName: {
      type: String
    },
    firstName: {
      type: String
    },
    cardType: {
      type: String
    },
    cardNum: {
      type: String
    }
  })
})

module.exports = mongoose.model('Ticket', TicketSchema)
