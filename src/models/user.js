var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')
const _ = require('lodash')
const { getImageUri } = require('../modules/utils')

var UserSchema = new Schema({
  profileStrength: Number,
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
  callingCode: String,
  // preferences
  notExceedBudget: false,
  // preferences for flight
  preferenceFlight: {
    homeAirport: String,
    homeAirportName: String,
    prefFlightSeat: String,
    prefAirline: String,
    prefAirlineName: String,
    prefFlightClass: String,
    prefFlightDuration: Number,
    prefDepartureTime: {
      min: Number,
      max: Number
    },
    prefArrivalTime: {
      min: Number,
      max: Number
    },
    prefFlightMeal: {
      prefMealTurkish: false,
      prefMealFrench: false,
      prefMealItalian: false,
      prefMealThailand: false,
      prefMealKorean: false,
      prefMealJapanese: false,
      prefMealChinese: false,
      prefMealIndian: false,
      prefMealBaby: false,
      prefMealLowFiber: false,
      prefMealLowFat: false,
      prefMealDiabetic: false,
      prefMealPeanutFree: false,
      prefMealNonLactose: false,
      prefMealLowSalt: false,
      prefMealLowPurine: false,
      prefMealLowProtein: false,
      prefMealKosher: false,
      prefMealHalal: false,
      prefMealHindu: false,
      prefMealBuddhist: false,
      prefMealJainVegeterian: false,
      prefMealVegeterian: false
    },
    flyerPrograms: [
      {
        name: String,
        number: String,
        active: false,
        iata: String
      }
    ]
  },
  // preferences for hotel
  preferenceHotel: {
    prefHotelClass: Number,
    prefHotelFacility: {
      prefHotelBreakfast: false,
      prefHotelWifi: false,
      prefHotelShuttle: false,
      prefHotelCancel: false,
      prefHotelNoPrepayment: false,
      prefHotelHotelType: false,
      prefHotelApartment: false,
      prefHotelDisabledGuest: false,
      prefHotel24hFrontDesk: false,
      prefHotelRestaurant: false,
      prefHotelFaxPhoto: false,
      prefHotelNonSmoking: false,
      prefHotelFitness: false,
      prefHotelSwimming: false,
      prefHotelBathtub: false,
      prefHotelParking: false,
      prefHotelTwinBeds: false
    },
    hotelPrograms: [
      {
        name: String,
        number: String,
        active: false
      }
    ]
  },
  favoriteHotels: [
    {
      address: String,
      cityName: String,
      country: String,
      description: String,
      hotelId: String,
      latitude: Number,
      longitude: Number,
      name: String,
      supplier: String,
      thumbnail: String,
      starRating: String
    }
  ]
})

UserSchema.plugin(passportLocalMongoose)

UserSchema.methods.toJSON = function() {
  var user = this
  var userObject = user.toObject()

  userObject = _.omit(userObject, [
    'hash',
    'salt',
    'resetPasswordToken',
    'resetPasswordExpires'
  ])
  userObject.avatar = getImageUri(userObject.avatar)

  return userObject
}

module.exports = mongoose.model('User', UserSchema)
