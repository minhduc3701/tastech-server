const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelSchema = new Schema({
  _id: Number
})

module.exports = mongoose.model('Hotel', HotelSchema)
