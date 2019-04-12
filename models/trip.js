var mongoose = require('mongoose')
var Schema = mongoose.Schema
var TripSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'ongoing'
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
      roomType: String,
      price: Number,
      numberRooms: Number,
      refundable: Boolean,
      numberSeleted: Number
    }
  ],
  departFlights: [
    {
      price: Number,
      departTime: Date,
      arrivalTime: Date,
      airline: String,
      flightCode: String,
      ticketCode: String,
      duration: String
    }
  ],
  passengers: [
    {
      businessEmail: String,
      dateOfBirth: Date,
      firstName: String,
      frequentFlyerNumber: String,
      frequentFlyerPropgram: String,
      gender: String,
      lastName: String,
      nationality: String,
      passportExpiryDate: Date,
      passportNo: Number,
      title: String
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
  conatactInfor: {
    city: String,
    country: String,
    phone1: Number,
    phone2: Number,
    postalAddress: Number,
    postalCode1: String,
    postalCode2: String,
    province: String
  },
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
