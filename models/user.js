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
    required: true,
    default: 'employee' // admin|boss|employee
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  firstName: String,
  lastName: String,
  avatar: String
})

UserSchema.plugin(passportLocalMongoose)

UserSchema.methods.toJSON = function() {
  var user = this
  var userObject = user.toObject()

  userObject = _.pick(userObject, [
    '_id',
    'email',
    'type',
    'firstName',
    'lastName',
    'resetPasswordToken',
    'avatar'
  ])
  userObject.avatar = process.env.AWS_S3_URI + '/' + userObject.avatar

  return userObject
}

module.exports = mongoose.model('User', UserSchema)
