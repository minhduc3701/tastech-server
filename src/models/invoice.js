const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InvoicesSchema = new Schema({
  invoiceId: String,
  externalId: String,
  status: String,
  payerEmail: String,
  amount: Number,
  description: String,
  invoiceUrl: String,
  expiryDate: Date,
  availableBanks: Array,
  currency: String,
  callBack: Object
})

module.exports = mongoose.model('Invoice', InvoicesSchema)
