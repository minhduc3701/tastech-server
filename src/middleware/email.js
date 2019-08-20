const { logger } = require('../config/winston')
const { mail } = require('../config/mail')
const mailTemplates = require('../config/mailTemplates.js')
const User = require('../models/user')
const Role = require('../models/role')
const _ = require('lodash')

const emailEmployeeSubmitTrip = async (req, res, next) => {
  let mailOptions = mailTemplates.submitTrip(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(error)
    }
  })
  next()
}

const emailManagerSubmitTrip = async (req, res) => {
  Role.findOne({
    _company: req.user._company,
    type: 'manager'
  })
    .then(role => {
      return User.find({
        _role: role._id
      })
    })
    .then(users => {
      console.log(users)
      if (!_.isEmpty(users)) {
        let mailOptions = mailTemplates.pendingTrip(users, req.trip, req.user)
        mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(error)
          }
        })
      }
    })
}
const emailEmployeeChangeTripStatus = async (req, res) => {
  if (req.trip) {
    let mailOptions = mailTemplates.changeTripStatus(req.user, req.trip)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        debugMail(error)
        logger.info('mail: ', { err: err })
      }
    })
  } else {
    logger.info('trip: ', { err: 'No trip' })
  }
}

module.exports = {
  emailEmployeeSubmitTrip,
  emailEmployeeChangeTripStatus,
  emailManagerSubmitTrip
}
