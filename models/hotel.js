const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelSchema = new Schema({
  _id: Number,
  name: String,
  starRating: Number,
  country: String,
  cityName: String,
  location: String,
  address: String,
  zip: Number,
  longitude: Number,
  latitude: Number,
  lowestPrice: Number
})

module.exports = mongoose.model('Hotel', HotelSchema)
