const Role = require('../models/role')
const Trip = require('../models/trip')
const User = require('../models/user')
const _ = require('lodash')

const isPartnerBooking = async (req, res, next) => {
  if (!req.body.onBehalf) {
    return next()
  }

  try {
    let role = await Role.findById(req.user._role)
    if (role.type === 'partner-admin') {
      let user = await User.findOne({
        _id: req.body.onBehalf,
        _partner: req.user._partner
      })

      // not found user
      if (!user) {
        return res.status(400).send({
          message: 'Cannot book on behalf'
        })
      }

      // swap onbehalf employee to req.user
      // and partner admin to req.partnerAdmin
      req.partnerAdmin = req.user
      req.user = user
    }
  } catch (error) {}

  next()
}

// update status book request from waiting to booked after booking
const updateBookingRequest = async (req, res, next) => {
  let { onBehalf, selectBookingRequest } = req.body
  if (!onBehalf || !selectBookingRequest) {
    return next()
  }
  try {
    let trip = await Trip.findOne({
      _id: _.get(selectBookingRequest, '_trip._id'),
      _creator: req.user._id,
      _partner: req.user._partner
    })
    if (!trip) {
      return next()
    }
    for (let index = 0; index < trip.requestBookOnBehalfs.length; index++) {
      if (trip.requestBookOnBehalfs[index].type === selectBookingRequest.type) {
        trip.requestBookOnBehalfs[index].status = 'booked'
      }
    }

    Trip.findOneAndUpdate(
      {
        _id: _.get(selectBookingRequest, '_trip._id'),
        _creator: req.user._id,
        _partner: req.user._partner
      },
      { $set: trip },
      { new: true }
    )
      .then()
      .catch()
  } catch (error) {}

  next()
}
module.exports = {
  isPartnerBooking,
  updateBookingRequest
}
