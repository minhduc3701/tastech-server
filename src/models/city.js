const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CitySchema = new Schema({
  _id: Number
})

module.exports = mongoose.model('City', CitySchema)
