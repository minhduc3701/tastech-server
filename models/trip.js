var mongoose = require('mongoose')
var Schema = mongoose.Schema
var TripSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  _creator: {
    type: 'ObjectId',
    required: true
  },
  _budget: {
    type: 'ObjectId'
  },
  checkoutStatus: {
    type: String,
    required: true,
    default: 'pending' // pending, completed, canceled
  },
  hotelCode: String,
  rooms: [
    {
      price: Number,
      roomType: String,
      numberRooms: Number
    }
  ],
  departFlights: [
    {
      price: Number,
      departTime: Date,
      arrivalTime: Date,
      airline: String,
      flightCode: String,
      ticketCode: String
    }
  ],
  returnFlights: [
    {
      price: Number,
      departTime: Date,
      arrivalTime: Date,
      airline: String,
      flightCode: String,
      ticketCode: String
    }
  ],
  payment: String,
  roundTrip: Boolean,
  numberPassengers: Number,
  flightClass: String,
  departure: String,
  departureDate: Date,
  arrival: String,
  returnDate: Date
})

module.exports = mongoose.model('Trip', TripSchema)
