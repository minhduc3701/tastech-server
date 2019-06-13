const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelAmenitySchema = new Schema(
  {
    hotelId: Number,
    amenityId: String,
    name: String
  },
  {
    collection: 'hotelAmenities'
  }
)

module.exports = mongoose.model('HotelAmenity', HotelAmenitySchema)
