const mongoose = require('mongoose')
const Schema = mongoose.Schema
const _ = require('lodash')

const ExpenseCategorySchema = new Schema(
  {
    _creator: {
      type: 'ObjectId',
      required: true,
      ref: 'User'
    },
    name: {
      type: String,
      required: false
    },
    _company: {
      type: 'ObjectId',
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema)
