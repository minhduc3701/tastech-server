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
  setDaysBeforeFlights: Boolean,
  daysBeforeFlights: Number,
  setFlightLimit: Boolean,
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
  setDaysBeforeLodging: Boolean,
  daysBeforeLodging: Number,
  setHotelLimit: Boolean,
  hotelLimit: Number,
  hotelNotification: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  hotelApproval: {
    type: String,
    enum: ['no', 'over', 'all']
  },
  setTransportLimit: Boolean,
  transportLimit: Number,
  setMealLimit: Boolean,
  mealLimit: Number,
  setProvision: Boolean,
  provision: Number, // in percent of (flight + lodging + (transportation + meal)*days )
  employees: [
    {
      type: 'ObjectId'
    }
  ]
})

module.exports = mongoose.model('Policy', PolicySchema)
