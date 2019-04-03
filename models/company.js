const mongoose = require('mongoose')
const Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')

const CompanySchema = new Schema({
  name: String,
  _creator: mongoose.Schema.Types.ObjectId,
  logo: String,
  address: String,
  website: String,
  country: String,
  city: String,
  companySize: Number,
  timezone: String,
  industry: String,
  departments: Array
})

CompanySchema.plugin(passportLocalMongoose)

CompanySchema.methods.toJSON = function() {
  var company = this
  var companyObject = company.toObject()

  companyObject = _.pick(companyObject, [
    '_id',
    'name',
    '_owner',
    'logo',
    'address',
    'website',
    'country',
    'city',
    'companySize',
    'timezone',
    'industry'
  ])
  companyObject.logo = companyObject.logo
    ? process.env.AWS_S3_URI + '/' + companyObject.logo
    : null

  return companyObject
}

module.exports = mongoose.model('Company', CompanySchema)
