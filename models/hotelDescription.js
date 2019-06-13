const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelDescriptionSchema = new Schema(
  {
    hotelId: Number,
    type: String,
    description: String
  },
  {
    collection: 'hotelDescriptions'
  }
)

module.exports = mongoose.model('HotelDescription', HotelDescriptionSchema)
