const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PolicySchema = new Schema({
  _company: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['default', 'enable', 'disable']
  },
  flightClass: String,
  stops: String,
  setDaysBeforeFlights: false,
  daysBeforeFlights: Number,
  setFlightLimit: false,
  flightLimit: Number,
  flightNotification: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  flightApproval: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  hotelClass: Number, // in stars
  hotelSearchDistance: Number, // in kilometes/miles
  setDaysBeforeLodging: false,
  daysBeforeLodging: Number,
  setHotelLimit: false,
  hotelLimit: Number,
  hotelNotification: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  hotelApproval: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  setTransportLimit: false,
  transportLimit: Number,
  setMealLimit: false,
  mealLimit: Number,
  provision: Number, // in percent of (flight + lodging + (transportation + meal)*days )
  employees: []
})

module.exports = mongoose.model('Policy', PolicySchema)
