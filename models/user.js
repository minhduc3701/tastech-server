var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')

var UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  firstName: String,
  lastName: String
})

UserSchema.plugin(passportLocalMongoose)

UserSchema.methods.toJSON = function() {
  var user = this
  var userObject = user.toObject()

  return _.pick(userObject, [
    '_id',
    'email',
    'type',
    'firstName',
    'lastName',
    'resetPasswordToken'
  ])
}

module.exports = mongoose.model('User', UserSchema)
