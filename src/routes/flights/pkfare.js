const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const Ticket = require('../../models/ticket')
const Airline = require('../../models/airline')
const Airport = require('../../models/airport')
const IataCity = require('../../models/iataCity')
const City = require('../../models/city')
const bodyParser = require('body-parser')
const zlib = require('zlib')
const request = require('request')
const { authentication } = require('../../config/pkfare')
const { currencyExchange } = require('../../middleware/currency')
const { debugPkfare } = require('../../config/debug')
const { makeFlightsData } = require('../../modules/utils')
const api = require('../../modules/api')
const { makePkfareFlightCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')

router.post('/shopping', currencyExchange, async (req, res) => {
  let isRoundTrip = req.body.search.searchAirLegs.length === 2
  let cacheKey = makePkfareFlightCacheKey(req.body.search)

  try {
    let cacheData = await getCache(cacheKey)

    let flights = makeFlightsData(cacheData.flights, {
      isRoundTrip,
      currency: req.currency,
      numberOfAdults: Number(req.body.search.adults)
    })

    return res.status(200).send({
      flights,
      airlines: cacheData.airlines,
      airports: cacheData.airports
    })
  } catch (e) {
    // do nothing to run the try block below
  }

  try {
    let flights = await api.shopping(req.body.search)

    // save flights to cache
    let rawFlights = { ...flights }

    flights = makeFlightsData(flights, {
      isRoundTrip,
      currency: req.currency,
      numberOfAdults: Number(req.body.search.adults)
    })

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

        // save all data for using 1 hour later
        setCache(
          cacheKey,
          {
            flights: rawFlights,
            airlines,
            airports
          },
          3600
        )
      })
      .catch(e => {
        res.status(400).send()
      })
  } catch (e) {
    res.status(400).send()
  }
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

module.exports = router
