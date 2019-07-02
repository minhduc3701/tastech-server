const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AirlineSchema = new Schema({})

module.exports = mongoose.model('Airline', AirlineSchema)
