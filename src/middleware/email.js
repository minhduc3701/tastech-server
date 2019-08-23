const { logger } = require('../config/winston')
const { mail } = require('../config/mail')
const User = require('../models/user')
const Role = require('../models/role')
const Expense = require('../models/expense')
const Orders = require('../models/order')
const _ = require('lodash')
const { submitTrip } = require('../mailTemplates/submitTrip')
const { pendingTrip } = require('../mailTemplates/pendingTrip')
const { claimExpense } = require('../mailTemplates/claimExpense')
const { pendingExpense } = require('../mailTemplates/pendingExpense')
const { changeExpenseStatus } = require('../mailTemplates/changeExpenseStatus')
const { changeTripStatus } = require('../mailTemplates/changeTripStatus')
const { checkoutFail } = require('../mailTemplates/checkoutFail')
const { tripItinerary } = require('../mailTemplates/tripItinerary')
const { debugMail } = require('../config/debug')

const emailEmployeeChangeExpenseStatus = async (req, res) => {
  if (!_.isEmpty(req.expense)) {
    Expense.findById(req.expense._id)
      .populate('_trip')
      .then(expense => {
        let mailOptions = changeExpenseStatus(req.user, expense)
        mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(err)
            logger.info('mail: ', { err: err })
          }
        })
      })
  } else {
    logger.info('trip: ', { err: 'No trip' })
  }
}

const emailEmployeeClaimExpense = async (req, res, next) => {
  let mailOptions = claimExpense(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(err)
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
          let mailOptions = pendingExpense(accountants, req.expenses, req.user)
          mail.sendMail(mailOptions, function(err, info) {
            if (err) {
              debugMail(err)
            }
          })
        }
      })
  } catch (error) {
    console.log(error)
  }
}

const emailEmployeeSubmitTrip = async (req, res, next) => {
  let mailOptions = submitTrip(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(err)
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
        let mailOptions = pendingTrip(users, req.trip, req.user)
        mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(err)
          }
        })
      }
    })
}
const emailEmployeeChangeTripStatus = async (req, res) => {
  if (req.trip) {
    let mailOptions = changeTripStatus(req.user, req.trip)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        debugMail(err)
        logger.info('mail: ', { err: err })
      }
    })
  } else {
    logger.info('trip: ', { err: 'No trip' })
  }
}

const emailEmployeeCheckoutFailed = async (req, res, next) => {
  if (!req.checkoutError) {
    return next()
  }
  let mailOptions = checkoutFail(req)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(err)
      logger.info('mail: ', { err: err })
    }
  })
}

const emailEmployeeIntinerary = async (req, res, next) => {
  if (!req.checkoutError) {
    let trip = req.trip
    Orders.find({
      _trip: trip._id,
      status: {
        $in: ['completed', 'processing']
      }
    }).then(orders => {
      let mailOptions = tripItinerary(req.user, orders)
      return mail.sendMail(mailOptions, function(err, info) {
        if (err) {
          debugMail(err)
          logger.info('mail: ', { err: err })
        }
      })
    })
  }
}

module.exports = {
  emailEmployeeSubmitTrip,
  emailEmployeeChangeTripStatus,
  emailManagerSubmitTrip,
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense,
  emailEmployeeChangeExpenseStatus,
  emailEmployeeCheckoutFailed,
  emailEmployeeIntinerary
}
