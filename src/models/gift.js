const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GiftSchema = new Schema({
  pay: String,
  transactionId: String,
  cart: Object,
  owner: {
    type: 'ObjectId',
    required: true
  }
})

module.exports = mongoose.model('Gift', GiftSchema)
