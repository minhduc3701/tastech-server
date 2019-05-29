const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const Ticket = require('../../models/ticket')
const Airline = require('../../models/airline')
const Airport = require('../../models/airport')
const bodyParser = require('body-parser')
const zlib = require('zlib')
const request = require('request')
const { authentication } = require('../../config/pkfare')

router.post('/shopping', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      search: req.body.search,
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
        // res.status(200).send(JSON.parse(dezipped.toString()))
        let flights = JSON.parse(dezipped.toString())
        flights = flights.data
        let isRoundTrip = req.body.search.searchAirLegs.length === 2
        flights = makeFlightsData(flights, isRoundTrip)

        let airlines = []
        let airports = []
        flights.forEach(flight => {
          flight.departureSegments.forEach(segment => {
            airlines.push(segment.airline)
            airports.push(segment.departure)
            airports.push(segment.arrival)
          })
          if (isRoundTrip) {
            flight.returnSegments.forEach(segment => {
              airlines.push(segment.airline)
              airports.push(segment.departure)
              airports.push(segment.arrival)
            })
          }
        })

        airlines = _.uniq(airlines)
        airports = _.uniq(airports)

        Promise.all([
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
          .then(results => {
            let arrAirline = results[0]
            let airlines = {}
            arrAirline.forEach(airline => {
              airlines[airline._doc.iata] = airline
            })
            let arrAirport = results[1]
            let airports = {}
            arrAirport.forEach(airport => {
              airports[airport._doc.airport_code] = airport
            })
            res.status(200).send({
              flights,
              airlines,
              airports
            })
          })
          .catch(e => {
            res.status(400).send()
          })
      })
    }
  )
})

router.post('/precisePricing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      pricing: req.body.pricing,
      authentication
    })
  ).toString('base64')
  request(
    `${process.env.PKFARE_URI}/precisePricing_V2?param=${base64}`,
    function(err, response, body) {
      if (err) {
        return res.status(400).send()
      }

      res.status(200).send(JSON.parse(body))
    }
  )
})

router.post('/penalty', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      penalty: req.body.penalty,
      authentication
    })
  ).toString('base64')
  request(`${process.env.PKFARE_URI}/penalty?param=${base64}`, function(
    err,
    response,
    body
  ) {
    if (err) {
      return res.status(400).send()
    }

    res.status(200).send(JSON.parse(body))
  })
})

router.post('/preciseBooking', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      booking: req.body.booking,
      authentication
    })
  ).toString('base64')
  request(`${process.env.PKFARE_URI}/preciseBooking?param=${base64}`, function(
    err,
    response,
    body
  ) {
    if (err) {
      return res.status(400).send()
    }

    res.status(200).send(JSON.parse(body))
  })
})

router.post('/cancel', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      cancel: req.body.cancel,
      authentication
    })
  ).toString('base64')
  request(`${process.env.PKFARE_URI}/cancel?param=${base64}`, function(
    err,
    response,
    body
  ) {
    if (err) {
      return res.status(400).send()
    }

    res.status(200).send(JSON.parse(body))
  })
})

router.post('/orderPricing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      orderPricing: req.body.orderPricing,
      authentication
    })
  ).toString('base64')
  request(`${process.env.PKFARE_URI}/orderPricing?param=${base64}`, function(
    err,
    response,
    body
  ) {
    if (err) {
      return res.status(400).send()
    }
    res.status(200).send(JSON.parse(body))
  })
})

router.post('/ticketing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      ticketing: req.body.ticketing,
      authentication
    })
  ).toString('base64')
  request(`${process.env.PKFARE_URI}/ticketing?param=${base64}`, function(
    err,
    response,
    body
  ) {
    if (err) {
      return res.status(400).send()
    }

    res.status(200).send(JSON.parse(body))
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
