var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')

var BudgetSchema = new Schema({
  name: String,
  destinations: [
    {
      from: String,
      date: Date
    }
  ],
  lastDestination: String,
  lastDestinationDate: Date,
  selectCategories: {
    flight: {
      selected: Boolean,
      price: Number
    },
    lodging: {
      selected: Boolean,
      price: Number
    },
    transportation: {
      selected: Boolean,
      price: Number
    },
    meal: {
      selected: Boolean,
      price: Number
    },
    provision: {
      selected: Boolean,
      provisionPrice: Number,
      rate: Number
    }
  },
  totalPrice: Number,
  NoP: Number,
  note: String,
  classType: String
})

BudgetSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('Budget', BudgetSchema)
