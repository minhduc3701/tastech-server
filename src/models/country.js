const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CountrySchema = new Schema({
  cca2: String,
  name: {},
  callingCode: []
})

module.exports = mongoose.model('Country', CountrySchema)
