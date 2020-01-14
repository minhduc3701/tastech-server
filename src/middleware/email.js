const { logger } = require('../config/winston')
const { mail } = require('../config/mail')
const User = require('../models/user')
const Role = require('../models/role')
const Expense = require('../models/expense')
const Order = require('../models/order')
const Users = require('../models/user')
const Airline = require('../models/airline')
const Airport = require('../models/airport')
const _ = require('lodash')
const { submitTrip } = require('../mailTemplates/submitTrip')
const { pendingTrip } = require('../mailTemplates/pendingTrip')
const { claimExpense } = require('../mailTemplates/claimExpense')
const { pendingExpense } = require('../mailTemplates/pendingExpense')
const { changeExpenseStatus } = require('../mailTemplates/changeExpenseStatus')
const { changeTripStatus } = require('../mailTemplates/changeTripStatus')
const { checkoutFail } = require('../mailTemplates/checkoutFail')
const { tripItinerary } = require('../mailTemplates/tripItinerary')
const { sendPnrGiamso } = require('../mailTemplates/sendPnrGiamso')
const { cancelFlightGiamso } = require('../mailTemplates/cancelFlightGiamso')
const { sendVoucherInfo } = require('../mailTemplates/sendVoucherInfo')
const { debugMail } = require('../config/debug')
const { CAN_ACCESS_BUDGET, CAN_ACCESS_EXPENSE } = require('../config/roles')

const emailEmployeeChangeExpenseStatus = async (req, res) => {
  if (!_.isEmpty(req.expense)) {
    Promise.all([
      User.findById(req.expense._creator),
      Expense.findById(req.expense._id).populate('_trip')
    ]).then(async results => {
      let user = results[0]
      let expense = results[1]
      let mailOptions = await changeExpenseStatus(
        req.headers.origin,
        user,
        expense
      )
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
  let mailOptions = await claimExpense(req.user)
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
      Role.find({
        _company: req.user._company,
        permissions: {
          $elemMatch: {
            $eq: CAN_ACCESS_EXPENSE
          }
        }
      })
    ])
      .then(results => {
        req.expenses = results[0]
        let roles = results[1]
        // find trip infor and  accountant account
        return User.find({
          _role: { $in: roles.map(role => role._id) }
        })
      })
      .then(async accountants => {
        if (!_.isEmpty(accountants)) {
          let mailOptions = await pendingExpense(
            req.headers.origin,
            accountants,
            req.expenses,
            req.user
          )
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
  let mailOptions = await submitTrip(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(err)
    }
  })
  next()
}

const emailManagerSubmitTrip = (req, res) => {
  Role.find({
    _company: req.user._company,
    permissions: {
      $elemMatch: {
        $eq: CAN_ACCESS_BUDGET
      }
    }
  })
    .then(roles => {
      return User.find({
        _role: {
          $in: roles.map(role => role._id)
        }
      })
    })
    .then(async users => {
      if (!_.isEmpty(users)) {
        let mailOptions = await pendingTrip(
          req.headers.origin,
          users,
          req.trip,
          req.user
        )
        mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(err)
          }
        })
      }
    })
}
const emailEmployeeChangeTripStatus = (req, res) => {
  if (req.trip) {
    Users.findById(req.trip._creator).then(async user => {
      let mailOptions = await changeTripStatus(
        req.headers.origin,
        user,
        req.trip
      )
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

const emailEmployeeCheckoutFailed = async (req, res, next) => {
  let { trip, flightOrder, hotelOrder } = req
  let chargedFailedFlight =
    trip.flight &&
    flightOrder &&
    flightOrder.status === 'failed' &&
    flightOrder.chargeId
  let chargedFailedHotel =
    trip.hotel &&
    hotelOrder &&
    hotelOrder.status === 'failed' &&
    hotelOrder.chargeId

  if (!chargedFailedFlight && !chargedFailedHotel) {
    return next()
  }

  let mailOptions = await checkoutFail(req)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(err)
      logger.info('mail: ', { err: err })
    }
  })

  next()
}

const emailEmployeeItinerary = async (req, res, next) => {
  if (!req.trip) {
    return
  }

  if (!req.checkoutError) {
    let trip = req.trip
    Order.find({
      _trip: trip._id,
      status: {
        $in: ['completed', 'processing']
      }
    }).then(async orders => {
      // get airlines and airports information
      let airlines = []
      let airports = []
      orders
        .filter(order => order.type === 'flight')
        .forEach(order => {
          _.get(order, 'flight.departureSegments', []).forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
          _.get(order, 'flight.returnSegments', []).forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
        })
      airlines = _.uniq(airlines)
      airports = _.uniq(airports)

      return Promise.all([
        Airline.find({
          iata: {
            $in: airlines
          }
        }),
        Airport.find({
          airport_code: {
            $in: airports
          }
        }),
        User.findById(_.get(orders, '[0]._customer'))
      ]).then(async results => {
        // map arr to object
        let arrAirline = results[0]
        let airlines = {}
        arrAirline.forEach(airline => {
          airlines[airline._doc.iata] = airline.toObject()
        })
        let arrAirport = results[1]
        let airports = {}
        arrAirport.forEach(airport => {
          airports[airport._doc.airport_code] = airport.toObject()
        })
        let user = results[2]
        let mailOptions = await tripItinerary(
          req.headers.origin,
          user,
          orders,
          airlines,
          airports
        )
        return mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(err)
            logger.info('mail: ', { err: err })
          }
        })
      })
    })
  }
}

const emailGiamsoIssueTicket = async (req, res, next) => {
  if (req.checkoutError && req.checkoutError.flight) {
    return next()
  }
  const flightOrder = req.flightOrder

  if (
    _.get(flightOrder, 'flight.supplier') !== 'sabre' ||
    flightOrder.status !== 'processing'
  ) {
    return next()
  } else {
    let mailOptions = await sendPnrGiamso(req.flightOrder)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        debugMail(err)
        logger.info('mail: ', { err: err })
      }
    })
  }
  return next()
}

const emailGiamsoCancelFlight = async (req, res, next) => {
  if (
    _.get(req.cancellingOrder, 'flight.supplier') !== 'sabre' &&
    _.get(req.cancellingOrder, 'status') !== 'cancelling'
  ) {
    return next()
  }

  let mailOptions = await cancelFlightGiamso(req.cancellingOrder)
  mail.sendMail(mailOptions, (err, info) => {
    if (err) {
      debugMail(err)
      logger.info('mail: ', { err: err })
    }
  })
}

const emailEmployeeItineraryPkfareTickiting = async (req, res, next) => {
  let order = req.order
  let user

  if (order) {
    Promise.all([
      Order.find({
        _trip: order._trip,
        status: {
          $in: ['completed', 'processing']
        }
      }),
      User.findById(order._customer)
    ]).then(async results => {
      let orders = results[0]
      user = results[1]

      // get airlines and airports information
      let airlines = []
      let airports = []
      orders
        .filter(order => order.type === 'flight')
        .forEach(order => {
          _.get(order, 'flight.departureSegments', []).forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
          _.get(order, 'flight.returnSegments', []).forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
        })
      airlines = _.uniq(airlines)
      airports = _.uniq(airports)

      return Promise.all([
        Airline.find({
          iata: {
            $in: airlines
          }
        }),
        Airport.find({
          airport_code: {
            $in: airports
          }
        })
      ]).then(async results => {
        // map arr to object
        let arrAirline = results[0]
        let airlines = {}
        arrAirline.forEach(airline => {
          airlines[airline._doc.iata] = airline.toObject()
        })
        let arrAirport = results[1]
        let airports = {}
        arrAirport.forEach(airport => {
          airports[airport._doc.airport_code] = airport.toObject()
        })
        let mailOptions = await tripItinerary(
          req.headers.origin,
          user,
          orders,
          airlines,
          airports
        )
        return mail.sendMail(mailOptions, function(err, info) {
          if (err) {
            debugMail(err)
            logger.info('mail: ', { err: err })
          }
        })
      })
    })
  }
}

const emailEzBizTripVoucherInfo = async (req, res, next) => {
  let mailOptions = await sendVoucherInfo(req.user, req.body)
  mail.sendMail(mailOptions, (err, info) => {
    if (err) {
      debugMail(err)
      logger.info('mail: ', { err: err })
    }
  })
}

module.exports = {
  emailEmployeeSubmitTrip,
  emailEmployeeChangeTripStatus,
  emailManagerSubmitTrip,
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense,
  emailEmployeeChangeExpenseStatus,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary,
  emailEmployeeItineraryPkfareTickiting,
  emailGiamsoIssueTicket,
  emailGiamsoCancelFlight,
  emailEzBizTripVoucherInfo
}
