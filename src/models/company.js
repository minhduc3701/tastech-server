const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { supportCurrencies } = require('../config/currency')
const _ = require('lodash')

const CompanySchema = new Schema({
  name: String,
  _creator: {
    type: 'ObjectId',
    required: true,
    ref: 'User'
  },
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
  // partner flow
  _partner: {
    type: 'ObjectId',
    ref: 'Partner'
  },
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  contactCallingCode: String,
  onBehalf: Boolean,
  payment: {
    type: String,
    enum: ['deposit', 'credit-card']
  },
  isCreditLimitation: Boolean,
  creditLimitationAmount: {
    type: Number,
    default: 0
  },
  warningAmount: {
    type: Number,
    default: 0
  },
  sendMailToCompanyAdmin: Boolean,
  sendMailToPartnerAdmin: Boolean,
  invoiceThroughEmail: Boolean,
  invoiceInHardCopy: Boolean,
  balance: Number,
  markupFlight: {
    type: String,
    enum: ['net', 'percentage']
  },
  markupFlightAmount: Number,
  markupHotel: {
    type: String,
    enum: ['net', 'percentage']
  },
  markupHotelAmount: Number,
  note: String,
  disabled: Boolean,
  deposit: {
    type: Number,
    default: 0
  },
  remainingCredit: {
    type: Number,
    default: 0
  },
  logs: [
    {
      _creator: {
        type: 'ObjectId',
        required: true,
        ref: 'User'
      },
      createdAt: Date,
      field: String,
      old: Number,
      new: Number,
      note: String
    }
  ]
})

CompanySchema.methods.toJSON = function() {
  var company = this
  var companyObject = _.omit(company.toObject(), ['logs'])

  companyObject.logo = companyObject.logo
    ? process.env.AWS_S3_URI + '/' + companyObject.logo
    : null

  return companyObject
}

module.exports = mongoose.model('Company', CompanySchema)
