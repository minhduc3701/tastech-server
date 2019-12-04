const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { supportCurrencies } = require('../config/currency')

const CompanySchema = new Schema({
  name: String,
  _creator: mongoose.Schema.Types.ObjectId,
  logo: String,
  address: String,
  website: String,
  country: String,
  city: String,
  companySize: String,
  timezone: String,
  industry: String,
  exchangedRate: {
    type: Number,
    default: 10
  },
  _policy: {
    type: 'ObjectId',
    ref: 'Policy'
  },
  currency: {
    type: String,
    required: true,
    enum: supportCurrencies
  },
  language: '',
  weightUnit: '',
  lengthUnit: '',
  _partner: {
    type: 'ObjectId',
    ref: 'Partner'
  }
})

CompanySchema.methods.toJSON = function() {
  var company = this
  var companyObject = company.toObject()

  companyObject.logo = companyObject.logo
    ? process.env.AWS_S3_URI + '/' + companyObject.logo
    : null

  return companyObject
}

module.exports = mongoose.model('Company', CompanySchema)
