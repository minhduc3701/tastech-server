const { logger } = require('../config/winston')
const { mail } = require('../config/mail')
const mailTemplates = require('../config/mailTemplates.js')
const User = require('../models/user')
const Role = require('../models/role')
const Expense = require('../models/expense')
const Trip = require('../models/trip')
const _ = require('lodash')

const emailEmployeeChangeExpenseStatus = async (req, res) => {
  if (!_.isEmpty(req.expense)) {
    Expense.findById(req.expense._id)
      .populate('_trip')
      .then(expense => {
        let mailOptions = mailTemplates.changeExpenseStatus(req.user, expense)
        mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(error)
            logger.info('mail: ', { err: err })
          }
        })
      })
  } else {
    logger.info('trip: ', { err: 'No trip' })
  }
}

const emailEmployeeClaimExpense = async (req, res, next) => {
  let mailOptions = mailTemplates.claimExpense(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(error)
    }
  })
  next()
}

const emailAccountantClaimExpense = async (req, res) => {
  try {
    // find expenses detail and role for accountant
    Promise.all([
      Expense.find({
        _creator: req.user.id,
        _id: { $in: req.expenseIds }
      }).populate('_trip'),
      Role.findOne({
        _company: req.user._company,
        type: 'accountant'
      })
    ])
      .then(results => {
        req.expenses = results[0]
        let role = results[1]
        // find trip infor and  accountant account
        return User.find({
          _role: role._id
        })
      })
      .then(accountants => {
        if (!_.isEmpty(accountants)) {
          let mailOptions = mailTemplates.pendingExpense(
            accountants,
            req.expenses,
            req.user
          )
          mail.sendMail(mailOptions, function(err, info) {
            if (err) {
              debugMail(error)
            }
          })
        }
      })
  } catch (error) {
    console.log(error)
  }
}

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
  emailManagerSubmitTrip,
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense,
  emailEmployeeChangeExpenseStatus
}
