const mongoose = require('mongoose')
const Schema = mongoose.Schema
const validator = require('validator')

const TripSchema = new Schema(
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
        note: String,
        startDestination: String,
        startDestinationCode: String,
        startDestinationDate: Date,
        lastDestination: String,
        lastDestinationCode: String,
        lastDestinationDate: Date,
        totalPrice: Number,
        flight: {
          selected: Boolean,
          departDate: Date,
          returnDate: Date,
          price: Number,
          flightType: String,
          departDestinationCode: String,
          returnDestinationCode: String,
          departDestination: String,
          returnDestination: String,
          class: String
        },
        lodging: {
          selected: Boolean,
          checkInDate: Date,
          checkOutDate: Date,
          price: Number,
          regionId: Number,
          regionName: String,
          regionCoordinates: [Number],
          class: Number
        },
        transportation: {
          selected: Boolean,
          price: Number,
          limit: Number
        },
        meal: {
          selected: Boolean,
          price: Number,
          limit: Number
        },
        others: {
          selected: Boolean,
          amount: Number,
          reason: String
        }
      }
    ],
    numberPassengers: String,
    startDate: Date,
    endDate: Date,
    adminMessage: String,
    updatedByAdmin: {
      type: 'ObjectId',
      ref: 'User'
    },
    updatedByAdminAt: Date,
    archived: {
      type: Boolean,
      default: false
    },
    businessTrip: {
      type: Boolean,
      default: false
    },
    currency: String,
    daysOfTrip: Number,
    isBudgetUpdated: {
      type: Boolean,
      default: false
    },
    isBookedByPartner: Boolean,
    isBookedWithinBudget: Boolean,
    isBookedWithinPolicy: Boolean,
    requestBookOnBehalfs: []
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Trip', TripSchema)
