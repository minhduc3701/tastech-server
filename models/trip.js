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
    passengers: [
      {
        businessEmail: {
          type: String,
          minlength: 1,
          required: true,
          trim: true,
          validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
          }
        },
        dateOfBirth: Date,
        firstName: {
          type: String,
          trim: true
        },
        lastName: {
          type: String,
          trim: true
        },
        frequentFlyerNumber: {
          type: String,
          trim: true
        },
        frequentFlyerPropgram: {
          type: String,
          trim: true
        },
        gender: {
          type: String,
          trim: true
        },
        nationality: {
          type: String,
          trim: true
        },
        passportExpiryDate: Date,
        passportNo: {
          type: String,
          trim: true
        },
        title: {
          type: String,
          trim: true
        }
      }
    ],
    contactInfo: {
      name: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        minlength: 1,
        required: true,
        trim: true,
        validate: {
          validator: validator.isEmail,
          message: '{VALUE} is not a valid email'
        }
      },
      city: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      },
      phone1: {
        type: String,
        trim: true
      },
      phone2: {
        type: String,
        trim: true
      },
      postalAddress: {
        type: String,
        trim: true
      },
      areaCode1: {
        type: String,
        trim: true
      },
      areaCode2: {
        type: String,
        trim: true
      },
      province: {
        type: String,
        trim: true
      }
    },
    roundTrip: Boolean,
    numberPassengers: String,
    flightClass: String,
    departure: String,
    departureDate: Date,
    arrival: String,
    returnDate: Date,
    adminMessage: String,
    updatedByAdmin: {
      type: 'ObjectId',
      ref: 'User'
    },
    updatedByAdminAt: Date,
    archived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Trip', TripSchema)
