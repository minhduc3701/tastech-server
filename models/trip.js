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
    businessTrip: Boolean
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Trip', TripSchema)
