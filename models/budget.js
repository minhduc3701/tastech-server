const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
const Schema = mongoose.Schema

const BudgetSchema = new Schema({
  _creator: {
    type: 'ObjectId',
    refer: 'user',
    required: true
  },
  _company: mongoose.Schema.Types.ObjectId,
  status: {
    type: String,
    default: 'waiting' // waiting, approved, rejected
  },
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
  numberOfPassengers: Number,
  note: String,
  classType: String
})

module.exports = mongoose.model('Budget', BudgetSchema)
