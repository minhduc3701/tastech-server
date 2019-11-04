const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const Company = require('../models/company')
const User = require('../models/user')
const Order = require('../models/order')
const Hotel = require('../models/hotel')
const Airline = require('../models/airline')
const Airport = require('../models/airport')
const { ObjectID } = require('mongodb')
const { authentication } = require('../config/pkfare')
const _ = require('lodash')
const axios = require('axios')
const Policy = require('../models/policy')
const moment = require('moment')
const {
  sabreCurrencyExchange,
  rewardCurrencyRate
} = require('../middleware/currency')
const { sabreRestToken } = require('../middleware/sabre')
const { makeSabreFlightsData } = require('../modules/utils')
const {
  makeSabreSearchRequestFromBudget,
  makeSabreRequestData
} = require('../modules/utilsSabre')
const apiSabre = require('../modules/apiSabre')
const htbApi = require('../modules/apiHotelbeds')
const {
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
} = require('../middleware/email')
const { currentCompany } = require('../middleware/company')

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 20)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))

  let isBusinessTrip = Number(_.get(req.query, 'businessTrip', 1))
  Promise.all([
    Trip.find({
      _creator: req.user._id,
      archived: { $ne: true },
      businessTrip: isBusinessTrip ? true : false
    })
      .sort({ updatedAt: -1 })
      .limit(perPage)
      .skip(perPage * page),
    Trip.countDocuments({
      _creator: req.user._id,
      archived: { $ne: true },
      businessTrip: isBusinessTrip ? true : false
    })
  ])
    .then(results => {
      let trips = results[0]
      let total = results[1]
      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: trips.length,
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

      let budget = req.body.budgetPassengers[0]
      // get Policy
      let companyPolicies = await Policy.find({
        _company: req.user._company
      })
      let policy = await Policy.findById(req.user._policy)
      if (!policy || policy.status === 'disabled') {
        for (let index = 0; index < companyPolicies.length; index++) {
          if (companyPolicies[index]._doc.status === 'default') {
            policy = companyPolicies[index]
            break
          }
        }
      }

      trip.budgetPassengers[0].totalPrice = 0
      // calcuate transportation budget
      if (
        policy.setTransportLimit &&
        trip.budgetPassengers[0].transportation.selected
      ) {
        trip.budgetPassengers[0].transportation.price = Number(
          policy.transportLimit * countDays
        )
        trip.budgetPassengers[0].transportation.limit = policy.transportLimit
        trip.budgetPassengers[0].totalPrice += Number(
          policy.transportLimit * countDays
        )
      } else {
        trip.budgetPassengers[0].transportation.price = 0
      }

      // calcuate meal budget
      if (policy.setMealLimit && trip.budgetPassengers[0].meal.selected) {
        trip.budgetPassengers[0].meal.price = Number(
          policy.mealLimit * countDays
        )
        trip.budgetPassengers[0].meal.limit = policy.mealLimit
        trip.budgetPassengers[0].totalPrice += Number(
          policy.mealLimit * countDays
        )
      } else {
        trip.budgetPassengers[0].meal.price = 0
      }
      //update travel other
      if (trip.budgetPassengers[0].others.selected) {
        trip.budgetPassengers[0].totalPrice += Number(
          trip.budgetPassengers[0].others.amount
        )
      }

      // calculate Flight budget
      if (trip.budgetPassengers[0].flight.selected) {
        let budgetRequest = makeSabreSearchRequestFromBudget(
          trip.budgetPassengers[0].flight,
          policy
        )
        let sabreRes = await apiSabre.shopping(
          makeSabreRequestData(budgetRequest),
          req.sabreRestToken
        )
        sabreRes = sabreRes.data.groupedItineraryResponse

        let flights = makeSabreFlightsData(sabreRes, req.currency, 1)

        let sumPrice = 0
        flights.forEach(flight => {
          sumPrice += Number(flight.price)
        })

        let averageFlightPrice = Math.round(Number(sumPrice / flights.length))
        // compare averagePrice with company policy
        if (policy.setFlightLimit && averageFlightPrice > policy.flightLimit) {
          trip.budgetPassengers[0].flight.price = policy.flightLimit
        } else {
          trip.budgetPassengers[0].flight.price = averageFlightPrice
        }

        // in case price still equal to 0
        if (trip.budgetPassengers[0].flight.price === 0) {
          trip.budgetPassengers[0].flight.price = policy.flightLimit
        }

        trip.budgetPassengers[0].totalPrice +=
          trip.budgetPassengers[0].flight.price
      } // end flight budget

      // hotel budget
      if (trip.budgetPassengers[0].lodging.selected) {
        trip.budgetPassengers[0].lodging.class = policy.hotelClass
        //  Calculate Hotel budget
        let request = {
          stay: {
            checkIn: budget.lodging.checkInDate,
            checkOut: budget.lodging.checkOutDate
          },
          occupancies: [
            {
              rooms: 1,
              adults: 1,
              children: 0
            }
          ],
          geolocation: {
            latitude: budget.lodging.regionCoordinates[0],
            longitude: budget.lodging.regionCoordinates[1],
            radius: 8,
            unit: 'km'
          },
          filter: {
            paymentType: 'AT_WEB'
          }
        }

        let responseHotel = await htbApi.getRooms(request)
        let { data } = responseHotel
        let hotelInfoList = _.get(data, 'hotels.hotels', [])
        hotelInfoList = hotelInfoList.filter(
          hotel => parseInt(hotel.categoryCode.charAt(0)) === policy.hotelClass
        )

        let sumPriceHotelRoom = 0
        hotelInfoList.forEach(hotel => {
          sumPriceHotelRoom += Number(hotel.minRate * req.currency.rate)
        })

        let averageHotelPrice = Math.round(
          Number(sumPriceHotelRoom / hotelInfoList.length)
        )

        // compare averagePrice with company policy
        if (policy.setHotelLimit && averageHotelPrice > policy.hotelLimit) {
          trip.budgetPassengers[0].lodging.price = policy.hotelLimit
        } else {
          trip.budgetPassengers[0].lodging.price = averageHotelPrice
        }

        // in case price still equal to 0
        if (trip.budgetPassengers[0].lodging.price === 0) {
          trip.budgetPassengers[0].lodging.price = policy.hotelLimit
        }

        trip.budgetPassengers[0].totalPrice +=
          trip.budgetPassengers[0].lodging.price
      }

      //Update trip information
      trip.budgetPassengers[0].totalPrice = Number(
        trip.budgetPassengers[0].totalPrice
      )
    } catch (error) {
      res.status(400).send()
    }

    // store for email
    req.trip = trip

    // error or not, must update isBudgetUpdated to true to show
    await Trip.findByIdAndUpdate(trip._id, {
      $set: {
        isBudgetUpdated: true,
        budgetPassengers: trip.budgetPassengers
      }
    })
    next()
  },
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
)

router.patch('/:id', function(req, res, next) {
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
    }).sort({ updatedAt: -1 })
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
