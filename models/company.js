const mongoose = require('mongoose')
const Schema = mongoose.Schema

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

CompanySchema.methods.toJSON = function() {
  var company = this
  var companyObject = company.toObject()

  companyObject.logo = companyObject.logo
    ? process.env.AWS_S3_URI + '/' + companyObject.logo
    : null

  return companyObject
}

module.exports = mongoose.model('Company', CompanySchema)
