var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')

var UserSchema = new Schema({
  email: String,
  passwd: String
})

module.exports = mongoose.model('User', UserSchema)
