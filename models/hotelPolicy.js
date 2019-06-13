const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelPolicySchema = new Schema(
  {
    hotelId: Number,
    type: String,
    name: String
  },
  {
    collection: 'hotelPolicies'
  }
)

module.exports = mongoose.model('HotelPolicy', HotelPolicySchema)
