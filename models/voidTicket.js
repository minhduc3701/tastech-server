const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoidTicketSchema = new Schema(
  {
    orderNum: String,
    voidOrderNum: String,
    voidOrderStatus: String,
    remark: String,
    voidResult: {},
    passengers: [
      {
        cardType: String,
        cardNum: String,
        lastName: String,
        firstName: String
      }
    ]
  },
  {
    collection: 'voidTickets'
  }
)

module.exports = mongoose.model('VoidTicket', VoidTicketSchema)
