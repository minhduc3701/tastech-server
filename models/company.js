const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CompanySchema = new Schema({
  name: String,
  _owner: mongoose.Schema.Types.ObjectId,
  _creator: mongoose.Schema.Types.ObjectId,
  departments: Array
})

module.exports = mongoose.model('Company', CompanySchema)
