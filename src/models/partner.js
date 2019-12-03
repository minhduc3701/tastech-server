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

PartnerSchema.methods.toJSON = function() {
  var partner = this
  var partnerObject = partner.toObject()

  partnerObject.logo = partnerObject.logo
    ? process.env.AWS_S3_URI + '/' + partnerObject.logo
    : null

  return partnerObject
}

module.exports = mongoose.model('Partner', PartnerSchema)
