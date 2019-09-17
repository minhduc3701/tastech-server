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
const { currencyExchange } = require('../middleware/currency')
const { makeFlightsData } = require('../modules/utils')
const api = require('../modules/api')
const htbApi = require('../modules/apiHotelbeds')
const {
  emailEmployeeSubmitTrip,
  emailManagerSubmitTrip
} = require('../middleware/email')

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
    businessTrip: true,
    archived: false,
    $or: [{ status: 'approved' }, { status: 'ongoing' }],
    endDate: { $gte: Date.now() }
  })
    .then(trips => res.status(200).send({ trips }))
    .catch(e => res.status(400).send())
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

router.post(
  '/',
  currencyExchange,
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
      if (trip.budgetPassengers[0].flight.selected) {
        // calculate Flight budget
        let searchAirLegs = []
        if (trip.budgetPassengers[0].flight.flightType === 'round-trip') {
          searchAirLegs = [
            {
              cabinClass: policy.flightClass, // Capitalize the First Letter
              departureDate: budget.flight.departDate,
              destination: budget.flight.returnDestinationCode,
              origin: budget.flight.departDestinationCode
            },
            {
              cabinClass: policy.flightClass, // Capitalize the First Letter
              departureDate: budget.flight.returnDate,
              destination: budget.flight.departDestinationCode,
              origin: budget.flight.returnDestinationCode
            }
          ]
        } else {
          searchAirLegs = [
            {
              cabinClass: policy.flightClass, // Capitalize the First Letter
              departureDate: budget.flight.departDate,
              destination: budget.flight.returnDestinationCode,
              origin: budget.flight.departDestinationCode
            }
          ]
        }
        let search = {
          adults: 1,
          children: 0,
          infants: 0,
          nonstop: 0,
          searchAirLegs,
          solutions: 0
        }
        trip.budgetPassengers[0].flight.class = policy.flightClass
        let flights = await api.shopping(search)
        let isRoundTrip = searchAirLegs.length === 2
        flights = makeFlightsData(flights, {
          isRoundTrip,
          currency: req.currency,
          numberOfAdults: 1
        })

        let sumPrice = 0
        flights.forEach(flight => {
          sumPrice += Number(flight.price)
        })
        trip.budgetPassengers[0].flight.price = Math.round(
          Number(sumPrice / flights.length)
        )
        trip.budgetPassengers[0].totalPrice +=
          trip.budgetPassengers[0].flight.price
      }
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
        let hotelInfoList = data.hotels.hotels

        let sumPriceHotelRoom = 0
        hotelInfoList.forEach(hotel => {
          sumPriceHotelRoom += Number(hotel.minRate * req.currency.rate)
        })
        trip.budgetPassengers[0].lodging.price = Math.round(
          Number(sumPriceHotelRoom / hotelInfoList.length)
        )
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

  Order.find({
    _customer: req.user._id,
    _trip: id
  })
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
      let point = Math.round((saveAmount * rate) / 100)
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

module.exports = router
