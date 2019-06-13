const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelImageSchema = new Schema(
  {
    hotelId: Number,
    type: String,
    url: String
  },
  {
    collection: 'hotelImages'
  }
)

module.exports = mongoose.model('HotelImage', HotelImageSchema)
