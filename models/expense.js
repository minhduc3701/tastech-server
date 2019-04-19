var mongoose = require('mongoose')
var Schema = mongoose.Schema
const _ = require('lodash')

var ExpenseSchema = new Schema({
  _creator: {
    type: 'ObjectId',
    required: true
  },
  attendees: [
    {
      type: 'ObjectId'
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
    required: true
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
    enum: ['waiting', 'claimed', 'approved', 'rejected']
  },
  _trip: {
    type: 'ObjectId',
    required: true
  },
  _company: {
    type: 'ObjectId',
    required: true
  },
  account: {
    type: String,
    required: true
  },
  receipts: [
    {
      type: String,
      required: true
    }
  ],
  message: String,
  city: String,
  vender: String
})

ExpenseSchema.methods.toJSON = function() {
  let expense = this
  let expenseObject = expense.toObject()

  for (let index = 0; index < expenseObject.receipts.length; index++) {
    expenseObject.receipts[index] =
      process.env.AWS_S3_URI + '/' + expenseObject.receipts[index]
  }

  return expenseObject
}

module.exports = mongoose.model('Expense', ExpenseSchema)
