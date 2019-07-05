const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelAmenityTypeSchema = new Schema(
  {
    amenityId: Number,
    groupId: Number,
    groupName: String,
    groupType: String
  },
  {
    collection: 'hotelAmenityTypes'
  }
)

module.exports = mongoose.model('HotelAmenityType', HotelAmenityTypeSchema)
