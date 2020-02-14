const mongoose = require('mongoose')
const Schema = mongoose.Schema
const validator = require('validator')
const _ = require('lodash')

const OrderSchema = new Schema(
  {
    _customer: {
      type: 'ObjectId',
      required: true,
      ref: 'User'
    },
    _bookedBy: {
      type: 'ObjectId',
      ref: 'User'
    },
    _company: {
      type: 'ObjectId',
      required: true,
      ref: 'Company'
    },
    _partner: {
      type: 'ObjectId',
      ref: 'Partner'
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
    rawCurrency: String,
    totalPrice: Number,
    rawTotalPrice: Number,
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
    childrenInfo: [
      {
        age: {
          type: Number,
          required: true
        },
        firstName: {
          type: String,
          trim: true
        },
        lastName: {
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
      lastName: {
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
      phone: {
        type: String,
        trim: true
      },
      callingCode: {
        type: String,
        trim: true
      }
    },
    supplierInfo: {},
    chargeId: String,
    chargeInfo: {},
    cancelCharge: Number,
    rawCancelCharge: Number,
    discountCode: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    rewardCost: {
      type: Number,
      default: 0
    },
    message: String,
    logs: [
      {
        _creator: {
          type: 'ObjectId',
          required: true,
          ref: 'User'
        },
        createdAt: Date,
        changedValues: [
          {
            field: String,
            old: Object,
            new: Object
          }
        ],
        note: String
      }
    ]
  },
  {
    timestamps: true
  }
)

OrderSchema.methods.toJSON = function() {
  var order = this
  var orderObject = order.toObject()

  orderObject = _.omit(orderObject, ['chargeInfo', 'chargeId'])

  return orderObject
}

module.exports = mongoose.model('Order', OrderSchema)
