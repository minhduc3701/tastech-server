const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CitySchema = new Schema({
  _id: Number,
  country: String
})

module.exports = mongoose.model('City', CitySchema)
