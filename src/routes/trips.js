const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const User = require('../models/user')
const Order = require('../models/order')
const Airline = require('../models/airline')
const Airport = require('../models/airport')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

const moment = require('moment')
const {
  sabreCurrencyExchange,
  rewardCurrencyRate
} = require('../middleware/currency')
const { sabreRestToken } = require('../middleware/sabre')

const {
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
} = require('../middleware/email')
const { calculateBudget } = require('../middleware/trips')
const { currentCompany } = require('../middleware/company')

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 15)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))

  let sortBy = _.get(req.query, 'sortBy', '')
  let sort = _.get(req.query, 'sort', 'desc')
  sort = sort === 'desc' ? -1 : 1

  let status = _.get(
    req.query,
    'status',
    'waiting,approved,rejected,ongoing,finished,completed'
  )
  status = status.split(',')
  let isBusinessTrip = Number(_.get(req.query, 'businessTrip', 1))

  let allStatus = []

  if (isBusinessTrip) {
    allStatus = [
      'waiting',
      'approved',
      'rejected',
      'ongoing',
      'finished',
      'completed'
    ]
  } else {
    allStatus = ['ongoing', 'finished']
  }

  status = status.filter(s => allStatus.includes(s))
  status = _.isEmpty(status) ? allStatus : status

  let objSort = {}
  if (sortBy) {
    if (sortBy === 'amount') {
      //https://stackoverflow.com/questions/35655747/how-to-sort-by-n-th-element-of-array-in-mongoose
      objSort = { 'budgetPassengers.0.totalPrice': sort }
    } else {
      objSort[sortBy] = sort
    }
  } else {
    objSort = { updatedAt: -1 }
  }

  let keyword = _.get(req.query, 's', '')
    .trim()
    .toLowerCase()

  Promise.all([
    Trip.find({
      _creator: req.user._id,
      archived: { $ne: true },
      businessTrip: isBusinessTrip ? true : false,
      status: { $in: status },
      name: {
        $regex: new RegExp(keyword),
        $options: 'i'
      }
    })
      .sort(objSort)
      .limit(perPage)
      .skip(perPage * page),
    Trip.countDocuments({
      _creator: req.user._id,
      archived: { $ne: true },
      businessTrip: isBusinessTrip ? true : false,
      status: { $in: status },
      name: {
        $regex: new RegExp(keyword),
        $options: 'i'
      }
    })
  ])
    .then(results => {
      let trips = results[0]
      let total = results[1]
      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        perPage,
        trips
      })
    })
    .catch(e => {
      res.send({ error: 'Not Found' })
    })
})

// response approved trips for booking
router.get('/booking', async (req, res) => {
  try {
    let trips = await Trip.find({
      _company: req.user._company,
      _creator: req.user._id,
      businessTrip: true,
      archived: false,
      $or: [{ status: 'approved' }, { status: 'ongoing' }],
      endDate: { $gte: Date.now() }
    })

    let tripsSpend = await Trip.aggregate([
      {
        $match: {
          _creator: req.user._id,
          businessTrip: true,
          $or: [
            {
              status: 'approved'
            },
            {
              status: 'ongoing'
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: '_trip',
          as: 'orders'
        }
      },
      {
        $unwind: '$orders'
      },
      {
        $group: {
          _id: '$_id',
          totalFlightSpend: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: ['$orders.type', 'flight']
                    },
                    {
                      $in: [
                        '$orders.status',
                        ['completed', 'processing', 'cancelling']
                      ]
                    }
                  ]
                },
                then: '$orders.totalPrice',
                else: 0
              }
            }
          },
          totalHotelSpend: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: ['$orders.type', 'hotel']
                    },
                    {
                      $in: ['$orders.status', ['completed']]
                    }
                  ]
                },
                then: '$orders.totalPrice',
                else: 0
              }
            }
          }
        }
      }
    ])

    trips = trips.map(trip => {
      let foundSpend = tripsSpend.find(
        ts => ts._id.toHexString() === trip._id.toHexString()
      )
      foundSpend = foundSpend || {
        totalFlightSpend: 0,
        totalHotelSpend: 0
      }

      return {
        ...trip.toObject(),
        ...foundSpend
      }
    })

    res.status(200).send({ trips })
  } catch (e) {
    res.status(400).send()
  }
})

// response available trips for adding expense
router.get('/expense', (req, res) => {
  let availableStatus = ['approved', 'ongoing', 'finished']
  Trip.find({
    _company: req.user._company,
    _creator: req.user._id,
    businessTrip: true,
    archived: false,
    status: { $in: availableStatus }
  })
    .then(trips => res.status(200).send({ trips }))
    .catch(e => res.status(400).send())
})

router.get(
  '/:id',
  currentCompany,
  rewardCurrencyRate,
  async (req, res, next) => {
    if (!ObjectID.isValid(req.params.id)) {
      return res.status(404).send()
    }

    try {
      let trip = await Trip.findOne({
        _creator: req.user._id,
        _id: req.params.id
      }).populate('updatedByAdmin')

      let tripsSpend = await Trip.aggregate([
        {
          $match: {
            _id: trip._id,
            _creator: req.user._id,
            businessTrip: true
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: '_trip',
            as: 'orders'
          }
        },
        {
          $unwind: '$orders'
        },
        {
          $group: {
            _id: '$_id',
            totalFlightSpend: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $eq: ['$orders.type', 'flight']
                      },
                      {
                        $in: [
                          '$orders.status',
                          ['completed', 'processing', 'cancelling']
                        ]
                      }
                    ]
                  },
                  then: '$orders.totalPrice',
                  else: 0
                }
              }
            },
            totalHotelSpend: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $eq: ['$orders.type', 'hotel']
                      },
                      {
                        $in: ['$orders.status', ['completed']]
                      }
                    ]
                  },
                  then: '$orders.totalPrice',
                  else: 0
                }
              }
            }
          }
        }
      ])

      let spendData = _.get(tripsSpend, '[0]', {
        totalFlightSpend: 0,
        totalHotelSpend: 0
      })

      let flightBudget = _.get(trip, 'budgetPassengers[0].flight.price', 0)
      let hotelBudget = _.get(trip, 'budgetPassengers[0].lodging.price', 0)

      let saveFlight = 0
      let saveHotel = 0

      // only calculate save spend if spend > 0
      // and spend < budget
      if (
        spendData.totalFlightSpend > 0 &&
        spendData.totalFlightSpend < flightBudget
      ) {
        saveFlight = flightBudget - spendData.totalFlightSpend
      }

      if (
        spendData.totalHotelSpend > 0 &&
        spendData.totalHotelSpend < hotelBudget
      ) {
        saveHotel = hotelBudget - spendData.totalHotelSpend
      }

      // exchange to base currency sgd
      let rewardSaveFlight = saveFlight * req.currency.rate
      let rewardSaveHotel = saveHotel * req.currency.rate

      // exchange to reward base currency
      let saveFlightPoint = Math.round(
        (rewardSaveFlight * req.company.exchangedRate) / 100
      )

      let saveHotelPoint = Math.round(
        (rewardSaveHotel * req.company.exchangedRate) / 100
      )

      res.status(200).json({
        trip: {
          ...trip.toObject(),
          ...spendData,
          flightBudget,
          hotelBudget,
          saveFlight,
          saveHotel,
          saveFlightPoint,
          saveHotelPoint
        }
      })
    } catch (e) {
      res.status(400).send()
    }
  }
)

// get trip's budget to edit
router.get('/:id/budget', (req, res) => {
  Trip.findOne({
    _id: req.params.id,
    _creator: req.user._id,
    businessTrip: true,
    archived: false,
    status: 'rejected'
  })
    .then(trip => res.status(200).send({ trip }))
    .catch(e => res.status(400).send())
})

router.patch(
  '/:id',
  sabreCurrencyExchange,
  sabreRestToken,
  async (req, res, next) => {
    try {
      let body = _.pick(req.body, [
        'name',
        'startDate',
        'endDate',
        'note',
        'budgetPassengers'
      ])
      body.daysOfTrip =
        moment(body.endDate).diff(moment(body.startDate), 'days') + 1
      body.isBudgetUpdated = false
      body.currency = req.currency.code
      body.status = 'waiting'

      Trip.findOneAndUpdate(
        {
          _id: req.params.id,
          _creator: req.user._id,
          businessTrip: true,
          archived: false,
          status: 'rejected'
        },
        { $set: body },
        { new: true }
      )
        .then(trip => {
          if (!trip) {
            return res.status(404).send()
          }
          res.status(200).send({ trip })
          // save for re-calculate budget and sending email to employee
          req.trip = trip
          next()
        })
        .catch(e => {
          res.status(400).send()
        })
    } catch (error) {
      res.status(400).send()
    }
  },
  calculateBudget,
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
)

router.post(
  '/',
  sabreCurrencyExchange,
  sabreRestToken,
  async (req, res, next) => {
    const trip = new Trip(req.body)
    trip._creator = req.user._id
    trip._company = req.user._company
    trip.businessTrip = true
    trip.currency = req.currency.code
    let countDays =
      moment(req.body.endDate).diff(moment(req.body.startDate), 'days') + 1
    trip.daysOfTrip = countDays
    trip.isBudgetUpdated = false

    try {
      // save and send back trip
      await trip.save()
      res.status(200).send({ trip })
      req.trip = trip
      next()
    } catch (error) {
      res.status(400).send()
    }
  },
  calculateBudget,
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
)

router.patch('/:id/archived', function(req, res, next) {
  let id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['archived'])

  Trip.findOneAndUpdate(
    {
      _creator: req.user._id,
      _company: req.user._company,
      _id: id
    },
    { $set: body },
    { new: true }
  )
    .then(trip => {
      if (!trip) {
        return res.status(404).send()
      }

      res.status(200).send({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

// get expenses by trip id
router.get('/:id/expenses', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Promise.all([
    Trip.findById(id),
    Expense.find({
      _creator: req.user._id,
      _trip: id
    })
      .sort({ updatedAt: -1 })
      .limit(100)
  ])
    .then(results => {
      let trip = results[0]
      let expenses = results[1]

      res.status(200).send({ trip, expenses })
    })
    .catch(e => res.status(400).send())
})

// get orders by trip
router.get('/:id/orders', function(req, res, next) {
  let id = req.params.id
  let airlines = []
  let airports = []
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let status = _.get(
    req,
    'query.status',
    'completed,processing,cancelling,cancelled'
  )

  status = status.split(',')

  let allStatus = [
    'completed',
    'processing',
    'failed',
    'pending',
    'cancelling',
    'cancelled'
  ]

  status = status.filter(s => allStatus.includes(s))

  Order.find({
    _customer: req.user._id,
    _trip: id,
    status: {
      $in: status
    }
  })
    .select('-chargeId -chargeInfo')
    .then(orders => {
      orders.forEach(order => {
        if (order.flight) {
          order.flight.departureSegments.forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
          order.flight.returnSegments.forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
        }
      })

      airlines = _.uniq(airlines)
      airports = _.uniq(airports)

      return Promise.all([
        orders,
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
      ])
    })
    .then(results => {
      let orders = results[0]
      let arrAirline = results[1]
      let arrAirport = results[2]
      let airlines = {}
      arrAirline.forEach(airline => {
        airlines[airline._doc.iata] = airline
      })
      let airports = {}
      arrAirport.forEach(airport => {
        airports[airport._doc.airport_code] = airport
      })

      res.status(200).send({
        orders,
        airlines,
        airports
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch(
  '/:id/exchange',
  currentCompany,
  rewardCurrencyRate,
  async (req, res, next) => {
    let id = req.params.id
    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    try {
      let trip = await Trip.findOneAndUpdate(
        {
          _id: id,
          _creator: req.user._id,
          status: 'finished'
        },
        { $set: { status: 'completed' } },
        { new: true }
      )

      if (!trip) {
        return res.status(404).send()
      }

      let tripsSpend = await Trip.aggregate([
        {
          $match: {
            _id: trip._id,
            _creator: req.user._id,
            businessTrip: true
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: '_trip',
            as: 'orders'
          }
        },
        {
          $unwind: '$orders'
        },
        {
          $group: {
            _id: '$_id',
            totalFlightSpend: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $eq: ['$orders.type', 'flight']
                      },
                      {
                        $in: [
                          '$orders.status',
                          ['completed', 'processing', 'cancelling']
                        ]
                      }
                    ]
                  },
                  then: '$orders.totalPrice',
                  else: 0
                }
              }
            },
            totalHotelSpend: {
              $sum: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $eq: ['$orders.type', 'hotel']
                      },
                      {
                        $in: ['$orders.status', ['completed']]
                      }
                    ]
                  },
                  then: '$orders.totalPrice',
                  else: 0
                }
              }
            }
          }
        }
      ])

      let spendData = _.get(tripsSpend, '[0]', {
        totalFlightSpend: 0,
        totalHotelSpend: 0
      })

      let flightBudget = _.get(trip, 'budgetPassengers[0].flight.price', 0)
      let hotelBudget = _.get(trip, 'budgetPassengers[0].lodging.price', 0)

      let saveFlight = 0
      let saveHotel = 0

      // only calculate save spend if spend > 0
      // and spend < budget
      if (
        spendData.totalFlightSpend > 0 &&
        spendData.totalFlightSpend < flightBudget
      ) {
        saveFlight = flightBudget - spendData.totalFlightSpend
      }

      if (
        spendData.totalHotelSpend > 0 &&
        spendData.totalHotelSpend < hotelBudget
      ) {
        saveHotel = hotelBudget - spendData.totalHotelSpend
      }

      // exchange to base currency sgd
      let rewardSaveFlight = saveFlight * req.currency.rate
      let rewardSaveHotel = saveHotel * req.currency.rate

      // exchange to reward base currency
      let saveFlightPoint = Math.round(
        (rewardSaveFlight * req.company.exchangedRate) / 100
      )

      let saveHotelPoint = Math.round(
        (rewardSaveHotel * req.company.exchangedRate) / 100
      )

      let savePoint = Math.round(saveFlightPoint + saveHotelPoint)

      let user = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { point: savePoint } },
        { new: true }
      )

      res.status(200).send({
        trip,
        user
      })
    } catch (e) {
      res.status(400).send()
    }
  }
)

module.exports = router
