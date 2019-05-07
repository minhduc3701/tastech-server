var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
var validator = require('validator')
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
  age: Number,
  avatar: String,
  _company: mongoose.Schema.Types.ObjectId,
  _department: {
    type: 'ObjectId',
    ref: 'Department'
  },
  _role: {
    type: 'ObjectId',
    ref: 'Role'
  },
  lastLoginDate: Date,
  disabled: Boolean
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
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age',
    'avatar',
    '_company',
    '_department',
    '_role',
    'lastLoginDate',
    'disabled'
  ])

  if (!validator.isURL(_.toString(userObject.avatar))) {
    userObject.avatar = userObject.avatar
      ? process.env.AWS_S3_URI + '/' + userObject.avatar
      : null
  }

  return userObject
}

module.exports = mongoose.model('User', UserSchema)
