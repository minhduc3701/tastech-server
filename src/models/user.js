var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')
const { getImageUri } = require('../modules/utils')

var UserSchema = new Schema({
  username: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  dateOfBirth: Date,
  country: String,
  displayName: String,
  title: String,
  firstName: String,
  lastName: String,
  phone: String,
  age: Number,
  avatar: String,
  passports: [
    {
      number: String,
      country: String,
      expiryDate: Date,
      active: false
    }
  ],
  allowSearch: false,
  _company: {
    type: 'ObjectId',
    ref: 'Company'
  },
  _department: {
    type: 'ObjectId',
    ref: 'Department'
  },
  _role: {
    type: 'ObjectId',
    ref: 'Role'
  },
  _policy: {
    type: 'ObjectId',
    ref: 'Policy'
  },
  point: {
    type: Number,
    default: 0
  },
  lastLoginDate: Date,
  disabled: Boolean,
  callingCode: String
})

UserSchema.plugin(passportLocalMongoose)

UserSchema.methods.toJSON = function() {
  var user = this
  var userObject = user.toObject()

  userObject = _.omit(userObject, ['hash', 'salt'])

  userObject.avatar = getImageUri(userObject.avatar)

  return userObject
}

module.exports = mongoose.model('User', UserSchema)
