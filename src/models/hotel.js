const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelSchema = new Schema({
  hotelId: Number
})

module.exports = mongoose.model('Hotel', HotelSchema)
