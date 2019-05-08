var mongoose = require('mongoose')
var Schema = mongoose.Schema

var TripSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    _company: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      required: true,
      enum: [
        'waiting',
        'approved',
        'rejected',
        'ongoing',
        'finished',
        'completed'
      ],
      default: 'waiting'
    },
    _creator: {
      type: 'ObjectId',
      ref: 'User',
      required: true
    },
    forCreator: Boolean,
    budgetPassengers: [
      {
        flight: Number,
        lodging: Number,
        transportation: Number,
        meal: Number,
        provision: Number,
        note: String,
        classType: String,
        destinations: [
          {
            from: String,
            date: Date
          }
        ],
        lastDestination: String,
        lastDestinationDate: Date,
        totalPrice: Number
      }
    ],
    checkoutStatus: {
      type: String,
      required: true,
      default: 'pending', // pending, completed, canceled
      enum: ['pending', 'completed', 'cancelled']
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
    departureFlight: {},
    returnFlight: {},
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
    contactInfo: {
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
    returnDate: Date,
    pnr: String,
    orderNum: String
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Trip', TripSchema)
