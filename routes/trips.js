const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const Company = require('../models/company')
const User = require('../models/user')
const Order = require('../models/order')
const Hotel = require('../models/hotel')
const { ObjectID } = require('mongodb')
const { authentication } = require('../config/pkfare')
const request = require('request')
const zlib = require('zlib')
const _ = require('lodash')
const axios = require('axios')
const Policy = require('../models/policy')
const moment = require('moment')
const { currentCompany } = require('../middleware/company')

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
    $or: [{ status: 'approved' }, { status: 'ongoing' }]
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

router.post('/', currentCompany, async (req, res, next) => {
  console.log('start!!!')
  const trip = new Trip(req.body)
  trip._creator = req.user._id
  trip._company = req.user._company
  trip.businessTrip = true
  trip.currency = req.company.currency
  let countDays =
    moment(req.body.endDate).diff(moment(req.body.startDate), 'days') + 1
  trip.daysOfTrip = countDays
  trip.isUpdated = false

  try {
    await trip.save()
    res.status(200).send()
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
    console.log(trip.budgetPassengers[0].totalPrice)
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
      console.log('+ transport: ', trip.budgetPassengers[0].totalPrice)
    } else {
      trip.budgetPassengers[0].transportation.price = 0
    }

    // calcuate meal budget
    if (policy.setMealLimit && trip.budgetPassengers[0].meal.selected) {
      trip.budgetPassengers[0].meal.price = Number(policy.mealLimit * countDays)
      trip.budgetPassengers[0].meal.limit = policy.mealLimit
      trip.budgetPassengers[0].totalPrice += Number(
        policy.mealLimit * countDays
      )
      console.log('+ meat: ', trip.budgetPassengers[0].totalPrice)
    } else {
      trip.budgetPassengers[0].meal.price = 0
    }

    if (trip.budgetPassengers[0].flight.selected) {
      // calculate Flight budget
      let searchAirLegs = []
      searchAirLegs = [
        {
          cabinClass: policy.flightClass.replace(/^\w/, c => c.toUpperCase()), // Capitalize the First Letter
          departureDate: budget.flight.departDate,
          destination: budget.flight.returnDestinationCode,
          origin: budget.flight.departDestinationCode
        },
        {
          cabinClass: policy.flightClass.replace(/^\w/, c => c.toUpperCase()), // Capitalize the First Letter
          departureDate: budget.flight.returnDate,
          destination: budget.flight.departDestinationCode,
          origin: budget.flight.returnDestinationCode
        }
      ]
      let search = {
        adults: 1,
        children: 0,
        infants: 0,
        nonstop: 0,
        searchAirLegs,
        solutions: 0
      }
      trip.budgetPassengers[0].flight.class = policy.flightClass
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
          zlib.gunzip(body, async (err, dezipped) => {
            let flights = JSON.parse(dezipped.toString())
            flights = flights.data
            let isRoundTrip = searchAirLegs.length === 2
            flights = makeFlightsData(flights, isRoundTrip)
            let sumPrice = 0
            flights.forEach(flight => {
              sumPrice += Number(flight.price)
            })
            trip.budgetPassengers[0].flight.price = Number(
              sumPrice / flights.length
            )
            trip.budgetPassengers[0].totalPrice += Number(
              sumPrice / flights.length
            )
            console.log('+ flight: ', trip.budgetPassengers[0].totalPrice)

            //  Calculate Hotel budget
            if (trip.budgetPassengers[0].lodging.selected) {
              trip.budgetPassengers[0].lodging.class = policy.hotelClass
              let request = {
                checkInDate: budget.lodging.checkInDate,
                checkOutDate: budget.lodging.checkOutDate,
                regionId: parseInt(budget.lodging.regionId),
                numberOfAdult: 1,
                numberOfRoom: 1,
                languageCode: 'en_US'
              }
              let responseHotel = await axios({
                method: 'post',
                url: `${process.env.PKFARE_HOTEL_URI}/queryHotelList`,
                data: {
                  authentication,
                  request
                }
              })
              let { data } = responseHotel
              console.log(data.body)
              let { hotelInfoList } = data.body
              let hotelIds = hotelInfoList.map(hotel => parseInt(hotel.hotelId))
              let hotels = await Hotel.find({
                _id: { $in: hotelIds },
                starRating: { $eq: policy.hotelClass }
              })
              let hotelPolicyIds = hotels.map(hotel => parseInt(hotel._id))
              request.hotelIdList = hotelPolicyIds
              let responseHotelRatePlan = await axios({
                method: 'post',
                url: `${
                  process.env.PKFARE_HOTEL_URI
                }/queryMultipleHotelRatePlan`,
                data: {
                  authentication,
                  request
                }
              })
              let ratePlanList = responseHotelRatePlan.data.body.ratePlanList
              let hotelRooms = []
              ratePlanList.forEach(ratePlan => {
                ratePlan.ratePlanDetailList.forEach(detail => {
                  hotelRooms.push(detail)
                })
              })

              let sumPriceHotelRoom = 0
              hotelRooms.forEach(rooms => {
                sumPriceHotelRoom += Number(rooms.totalPrice)
              })
              trip.budgetPassengers[0].lodging.price =
                sumPriceHotelRoom / hotelRooms.length
              trip.budgetPassengers[0].totalPrice += Number(
                sumPriceHotelRoom / hotelRooms.length
              )
              console.log('+ hotel: ', trip.budgetPassengers[0].totalPrice)
            }

            //update travel other
            if (trip.budgetPassengers[0].others.selected) {
              trip.budgetPassengers[0].totalPrice += Number(
                trip.budgetPassengers[0].others.amount
              )
              console.log('+ other: ', trip.budgetPassengers[0].totalPrice)
            }

            trip.budgetPassengers[0].totalPrice = Number(
              trip.budgetPassengers[0].totalPrice.toFixed(2)
            )
            console.log('final: ', trip.budgetPassengers[0].totalPrice)
            trip.isUpdated = true

            //Update trip information
            Trip.findByIdAndUpdate(
              trip._id,
              { $set: trip },
              { new: true }
            ).then(trip => {
              console.log('success')
            })
          })
        }
      )
    } else if (trip.budgetPassengers[0].lodging.selected) {
      trip.budgetPassengers[0].lodging.class = policy.hotelClass
      //  Calculate Hotel budget
      let request = {
        checkInDate: budget.lodging.checkInDate,
        checkOutDate: budget.lodging.checkOutDate,
        regionId: parseInt(budget.lodging.regionId),
        // regionId: 6001380,
        numberOfAdult: 1,
        numberOfRoom: 1,
        languageCode: 'en_US'
      }
      let responseHotel = await axios({
        method: 'post',
        url: `${process.env.PKFARE_HOTEL_URI}/queryHotelList`,
        data: {
          authentication,
          request
        }
      })
      let { data } = responseHotel
      let { hotelInfoList } = data.body
      let hotelIds = hotelInfoList.map(hotel => parseInt(hotel.hotelId))
      let hotels = await Hotel.find({
        _id: { $in: hotelIds },
        starRating: { $eq: policy.hotelClass }
      })
      let hotelPolicyIds = hotels.map(hotel => parseInt(hotel._id))
      request.hotelIdList = hotelPolicyIds
      let responseHotelRatePlan = await axios({
        method: 'post',
        url: `${process.env.PKFARE_HOTEL_URI}/queryMultipleHotelRatePlan`,
        data: {
          authentication,
          request
        }
      })
      let ratePlanList = responseHotelRatePlan.data.body.ratePlanList
      let hotelRooms = []
      ratePlanList.forEach(ratePlan => {
        ratePlan.ratePlanDetailList.forEach(detail => {
          hotelRooms.push(detail)
        })
      })

      let sumPriceHotelRoom = 0
      hotelRooms.forEach(rooms => {
        sumPriceHotelRoom += Number(rooms.totalPrice)
      })
      trip.budgetPassengers[0].lodging.price =
        sumPriceHotelRoom / hotelRooms.length
      trip.budgetPassengers[0].totalPrice += Number(
        sumPriceHotelRoom / hotelRooms.length
      )

      //update travel other
      if (trip.budgetPassengers[0].others.selected) {
        trip.budgetPassengers[0].totalPrice += Number(
          trip.budgetPassengers[0].others.amount
        )
        console.log(trip.budgetPassengers[0].totalPrice)
      }
      //Update trip information
      trip.budgetPassengers[0].totalPrice = Number(
        trip.budgetPassengers[0].totalPrice.toFixed(2)
      )
      trip.isUpdated = true

      Trip.findByIdAndUpdate(trip._id, { $set: trip }, { new: true }).then(
        trip => {
          console.log('success')
        }
      )
    } else {
      //update travel other
      if (trip.budgetPassengers[0].others.selected) {
        trip.budgetPassengers[0].totalPrice += Number(
          trip.budgetPassengers[0].others.amount
        )
        console.log(trip.budgetPassengers[0].totalPrice)
      }
      //Update trip information
      trip.budgetPassengers[0].totalPrice = Number(
        trip.budgetPassengers[0].totalPrice.toFixed(2)
      )
      trip.isUpdated = true
      Trip.findByIdAndUpdate(trip._id, { $set: trip }, { new: true }).then(
        trip => {
          console.log('success')
        }
      )
    }
  } catch (error) {
    console.log(error)
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
