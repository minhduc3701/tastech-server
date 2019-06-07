const mongoose = require('mongoose')
const Schema = mongoose.Schema
const validator = require('validator')

const OrderSchema = new Schema(
  {
    _customer: {
      type: 'ObjectId',
      required: true,
      ref: 'User'
    },
    _trip: {
      type: 'ObjectId',
      required: true,
      ref: 'Trip'
    },
    type: {
      type: String,
      enum: ['flight', 'hotel'],
      required: true
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelling',
        'cancelled'
      ]
    },
    customerCode: String,
    number: String,
    cancelNumber: String,
    currency: String,
    total: Number,
    flight: {},
    hotel: {},
    rejectedReason: String, // rejected reason for cancellation
    pnr: String,
    canCancel: Boolean,
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
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Order', OrderSchema)
