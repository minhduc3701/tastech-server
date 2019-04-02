var mongoose = require('mongoose')
var Schema = mongoose.Schema
var TripSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  _creator: {
    type: 'ObjectId',
    required: true
  },
  checkout: {
    type: Boolean,
    required: true,
    default: false
  },
  _passengers: [
    {
      _id: {
        type: 'ObjectId',
        required: true
      }
    }
  ],
  start_location: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Trip', TripSchema)
