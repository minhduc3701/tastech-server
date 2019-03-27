var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')

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
    refer: 'user',
    required: true
  }
})

TripSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('Trip', TripSchema)
