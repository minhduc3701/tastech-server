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
  country: String,
  title: String,
  firstName: String,
  lastName: String,
  phone: String,
  role: String,
  age: String
})

UserSchema.plugin(passportLocalMongoose)

UserSchema.methods.toJSON = function() {
  var user = this
  var userObject = user.toObject()

  return _.pick(userObject, [
    '_id',
    'email',
    'type',
    'country',
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age',
    'resetPasswordToken'
  ])
}

module.exports = mongoose.model('User', UserSchema)
