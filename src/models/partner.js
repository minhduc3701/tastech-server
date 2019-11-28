var mongoose = require('mongoose')
var Schema = mongoose.Schema
const _ = require('lodash')
const { supportCurrencies } = require('../config/currency')

var PartnerSchema = new Schema({
  name: String,
  address: String,
  country: String,
  title: String,
  fullName: String,
  logo: String,
  email: String,
  phone: String,
  currency: {
    type: String,
    required: true,
    enum: supportCurrencies
  },
  companyRole: {
    type: 'ObjectId',
    ref: 'Role'
  },
  saleStaff: {
    type: 'ObjectId',
    ref: 'User'
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
