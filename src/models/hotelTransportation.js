const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelTransportationSchema = new Schema(
  {
    hotelId: Number,
    description: String
  },
  {
    collection: 'hotelTransportations'
  }
)

module.exports = mongoose.model(
  'HotelTransportation',
  HotelTransportationSchema
)
