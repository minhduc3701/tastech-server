const mongoose = require('mongoose')
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
  forCreator: Boolean,
  _company: {
    type: 'ObjectId'
  },
  name: String,
  passengers: [
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
      lastDestinationDate: Date
    }
  ]
})

module.exports = mongoose.model('Budget', BudgetSchema)
