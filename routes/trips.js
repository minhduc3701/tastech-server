const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const Company = require('../models/company')
const User = require('../models/user')
const Order = require('../models/order')
const { ObjectID } = require('mongodb')
const { authentication } = require('../config/pkfare')
const request = require('request')
const zlib = require('zlib')
const _ = require('lodash')

router.get('/', function(req, res, next) {
  Trip.find({
    _creator: req.user._id,
    archived: { $ne: true }
  })
    .sort({ updatedAt: -1 })
    .then(trips => {
      res.send({ trips })
    })
    .catch(e => {
      res.send({ error: 'Not Found' })
    })
})

// response approved trips for booking
router.get('/booking', (req, res) => {
  Trip.find({
    _company: req.user._company,
    _creator: req.user._id,
    status: 'approved'
  })
    .then(trips => res.status(200).send({ trips }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Trip.findOne({
    _creator: req.user._id,
    _id: req.params.id
  })
    .populate('updatedByAdmin')
    .then(trip => {
      res.status(200).json({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', async (req, res, next) => {
  const trip = new Trip(req.body)
  trip._creator = req.user._id
  trip._company = req.user._company
  try {
    await trip.save()
    let budget = req.body.budgetPassengers[0]
    let searchAirLegs = []
    searchAirLegs = [
      {
        // cabinClass: classOption.value,
        cabinClass: 'Economy',
        departureDate: budget.startDestinationDate,
        destination: budget.lastDestinationCode,
        origin: budget.startDestinationCode
      }
      // {
      //   cabinClass: "Economy",
      //   departureDate: budget.lastDestinationDate,
      //   destination: budget.startDestinationCode,
      //   origin: budget.lastDestinationCode,
      // }
    ]
    let search = {
      adults: 1,
      children: 0,
      infants: 0,
      nonstop: 0,
      searchAirLegs,
      solutions: 0
    }
    let base64 = Buffer.from(
      JSON.stringify({
        search,
        authentication
      })
    ).toString('base64')
    request(
      `${process.env.PKFARE_URI}/shoppingV2?param=${base64}`,
      { encoding: null },
      function(err, response, body) {
        if (err) {
          return res.status(400).send()
        }
        zlib.gunzip(body, function(err, dezipped) {
          let flights = JSON.parse(dezipped.toString())
          flights = flights.data
          let isRoundTrip = searchAirLegs.length === 2
          flights = makeFlightsData(flights, isRoundTrip)
          let sumPrice = 0
          let max = Number(flights[0].price)
          flights.forEach(flight => {
            if (Number(flight.price) > max) {
              max = Number(flight.price)
            }
            sumPrice += Number(flight.price)
          })
          trip.budgetPassengers[0].flight.price = sumPrice / flights.length

          Trip.findByIdAndUpdate(trip._id, { $set: trip }, { new: true }).then(
            trip => {
              if (!trip) {
                return res.status(404).send()
              }
              res.status(200).send({ trip })
            }
          )
        })
      }
    )
  } catch (error) {
    return res.status(404).send()
  }
})

router.patch('/:id', function(req, res, next) {
  let id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Trip.findByIdAndUpdate(id, { $set: req.body }, { new: true })
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

router.patch('/:id/exchange', function(req, res, next) {
  let id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Trip.findOneAndUpdate(
    {
      _id: id,
      _creator: req.user._id
    },
    { $set: { status: 'completed' } },
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

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Order.find({
    _customer: req.user._id,
    _trip: id
  })
    .then(orders => {
      res.status(200).send({ orders })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id/exchange', function(req, res, next) {
  let id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Promise.all([
    Trip.findOneAndUpdate(
      {
        _id: id,
        _creator: req.user._id,
        status: 'finished'
      },
      { $set: { status: 'completed' } },
      { new: true }
    ),
    Expense.find({
      _creator: req.user._id,
      _trip: id,
      status: 'approved'
    }),
    Company.findById(req.user._company)
  ])
    .then(result => {
      let trip = result[0]
      let expenses = result[1]
      let company = result[2]
      let budget = trip.budgetPassengers[0].totalPrice
      let totalAmount = 0
      let saveAmount = 0
      expenses.map(expense => {
        totalAmount += expense.amount
      })
      if (budget > totalAmount) {
        saveAmount = budget - totalAmount
      }
      let rate = company.exchangedRate
      let point = (saveAmount * rate) / 100
      return User.findByIdAndUpdate(
        req.user._id,
        { $inc: { point: point } },
        { new: true }
      )
    })
    .then(user => {
      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})
const makeFlightsData = (data, isRoundTrip) => {
  let flightsData = []
  if (data) {
    data.solutions.forEach(solution => {
      let departureFlights = data.flights.filter(
        flight =>
          solution.journeys.journey_0.findIndex(
            flightId => flightId === flight.flightId
          ) >= 0
      )
      let departureFlight = departureFlights[0]

      let departureSegments = []
      let departureSegmentIds = departureFlight.segmengtIds
      departureSegmentIds.forEach(id => {
        let segmentIndex = data.segments.findIndex(
          segment => segment.segmentId === id
        )
        let segment = data.segments[segmentIndex]
        departureSegments.push(segment)
      })

      let returnFlight = {}
      let returnSegments = []
      if (isRoundTrip) {
        // return flight
        let returnFlights = data.flights.filter(
          flight =>
            solution.journeys.journey_1.findIndex(
              flightId => flightId === flight.flightId
            ) >= 0
        )
        returnFlight = returnFlights[0]

        let returnSegmentIds = returnFlight.segmengtIds
        returnSegmentIds.forEach(id => {
          let segmentIndex = data.segments.findIndex(
            segment => segment.segmentId === id
          )
          let segment = data.segments[segmentIndex]
          returnSegments.push(segment)
        })
      }

      let priceBreakdown = [
        'adtFare',
        'adtTax',
        'tktFee',
        'chdFare',
        'chdTax',
        'tktFee',
        'platformServiceFee',
        'merchantFee'
      ]

      let price = priceBreakdown.reduce((acc, fee) => solution[fee] + acc, 0)
      price = price.toFixed(2)

      flightsData.push({
        ...solution,
        price,
        departureFlight,
        departureSegments,
        returnFlight,
        returnSegments,
        supplier: 'pkfare'
      })
    })
  }
  return flightsData
}
module.exports = router
