var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
var validator = require('validator')
const _ = require('lodash')

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
  allowNotification: false,
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

  userObject = _.pick(userObject, [
    '_id',
    'email',
    'type',
    'country',
    'displayName',
    'title',
    'firstName',
    'lastName',
    'phone',
    'age',
    'avatar',
    '_company',
    '_department',
    '_role',
    '_policy',
    'lastLoginDate',
    'disabled',
    'point',
    'dateOfBirth',
    'passports',
    'allowSearch',
    'allowNotification',
    'callingCode'
  ])

  if (!validator.isURL(_.toString(userObject.avatar))) {
    userObject.avatar = userObject.avatar
      ? process.env.AWS_S3_URI + '/' + userObject.avatar
      : null
  }

  return userObject
}

module.exports = mongoose.model('User', UserSchema)
