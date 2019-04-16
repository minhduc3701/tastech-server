const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PolicySchema = new Schema({
  _creator: {
    type: 'ObjectId',
    refer: 'user',
    required: true
  },
  _company: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true
  },
  flightPolicy: {
    fareClass: String,
    stops: String,
    applyDueDate: false,
    dueDateValue: Number,
    applyCostLimit: false,
    costLimitValue: Number,
    notifiOption: String, // no(no notifications), over(over budget), all(all bookings)
    appovalOption: String // no(no need approval), over(over budget), all(all bookings)
  },
  lodgingPolicy: {
    hotelRating: Number, // in stars
    distance: Number, // in kilometes/miles
    applyDueDate: false,
    dueDateValue: Number,
    applyCostLimit: false,
    costLimitValue: Number,
    notifiOption: String, // no(no notifications), over(over budget), all(all bookings)
    appovalOption: String // no(no need approval), over(over budget), all(all bookings)
  },
  transportation: {
    applyCostLimit: false, // per day
    costLimitValue: Number
  },
  meal: {
    applyCostLimit: false, // per day
    costLimitValue: Number
  },
  provision: Number, // in percent of (flight + lodging + (transportation + meal)*days )
  employees: []
})

module.exports = mongoose.model('Policy', PolicySchema)
