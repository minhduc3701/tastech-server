const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CountrySchema = new Schema({})

module.exports = mongoose.model('Country', CountrySchema)
