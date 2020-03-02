var mongoose = require('mongoose')
var Schema = mongoose.Schema
const _ = require('lodash')
const { supportCurrencies } = require('../config/currency')

var PartnerSchema = new Schema({
  name: String,
  address: String,
  country: String,
  contactTitle: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  currency: {
    type: String,
    required: true,
    enum: supportCurrencies
  },
  disabled: Boolean
})

module.exports = mongoose.model('Partner', PartnerSchema)
