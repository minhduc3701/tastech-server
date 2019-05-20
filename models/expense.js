var mongoose = require('mongoose')
var Schema = mongoose.Schema
const _ = require('lodash')

var ExpenseSchema = new Schema(
  {
    _creator: {
      type: 'ObjectId',
      required: true,
      ref: 'User'
    },
    _attendees: [
      {
        type: 'ObjectId',
        ref: 'User'
      }
    ],
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['flight', 'lodging', 'transportation', 'meal']
    },
    claimed: {
      type: Boolean,
      default: false
    },
    transactionDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      default: 'waiting',
      enum: ['waiting', 'claiming', 'approved', 'rejected']
    },
    _trip: {
      type: 'ObjectId',
      required: true,
      ref: 'Trip'
    },
    _company: {
      type: 'ObjectId',
      required: true
    },
    account: {
      type: String,
      required: true,
      enum: ['credit-card', 'cash']
    },
    receipts: [
      {
        type: String,
        required: true
      }
    ],
    message: String,
    adminMessage: String,
    city: String,
    vendor: String
  },
  {
    timestamps: true
  }
)

ExpenseSchema.methods.toJSON = function() {
  let expense = this
  let expenseObject = expense.toObject()
  expenseObject.receipts = expenseObject.receipts.map(
    receipt => (receipt = process.env.AWS_S3_URI + '/' + receipt)
  )
  return expenseObject
}

module.exports = mongoose.model('Expense', ExpenseSchema)
