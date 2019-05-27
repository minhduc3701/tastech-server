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
        passportNo: String,
        title: String
      }
    ],
    contactInfo: {
      name: String,
      email: String,
      city: String,
      country: String,
      phone1: String,
      phone2: String,
      postalAddress: String,
      areaCode1: String,
      areaCode2: String,
      province: String
    },
    roundTrip: Boolean,
    numberPassengers: String,
    flightClass: String,
    departure: String,
    departureDate: Date,
    arrival: String,
    returnDate: Date,
    adminMessage: String
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Trip', TripSchema)
