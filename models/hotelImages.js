const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HotelImageSchema = new Schema({
  _id: Number
})

module.exports = mongoose.model('HotelImage', HotelImageSchema)
