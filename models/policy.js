const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PolicySchema = new Schema({
  _company: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true
  },
  flightClass: String,
  stops: String,
  setDaysBeforeFlights: false,
  daysBeforeFlights: Number,
  setFlightLimit: false,
  flightLimit: Number,
  flightNotification: String, // no(no notifications), over(over budget), all(all bookings)
  flightApproval: String, // no(no need approval), over(over budget), all(all bookings)
  hotelClass: Number, // in stars
  hotelSearchDistance: Number, // in kilometes/miles
  setDaysBeforeLodging: false,
  daysBeforeLodging: Number,
  setHotelLimit: false,
  hotelLimit: Number,
  hotelNotification: String, // no(no notifications), over(over budget), all(all bookings)
  hotelApproval: String, // no(no need approval), over(over budget), all(all bookings)
  setTransportLimit: false,
  transportLimit: Number,
  setMealLimit: false,
  mealLimit: Number,
  provision: Number, // in percent of (flight + lodging + (transportation + meal)*days )
  employees: []
})

module.exports = mongoose.model('Policy', PolicySchema)
