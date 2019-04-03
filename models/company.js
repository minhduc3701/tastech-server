const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CompanySchema = new Schema({
  name: String,
  _creator: mongoose.Schema.Types.ObjectId,
  departments: Array
})

module.exports = mongoose.model('Company', CompanySchema)
