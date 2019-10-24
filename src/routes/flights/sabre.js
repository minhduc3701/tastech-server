const axios = require('axios')
const express = require('express')
const router = express.Router()
const apiSabre = require('../../modules/apiSabre')
const moment = require('moment')
const Airline = require('../../models/airline')
const Airport = require('../../models/airport')
const IataCity = require('../../models/iataCity')
const _ = require('lodash')
const { sabreCurrencyExchange } = require('../../middleware/currency')
const { sabreToken } = require('../../middleware/sabre')
const { makeSabreFlightsData } = require('../../modules/utils')
const { logger } = require('../../config/winston')
const { makeSabreRequestData } = require('../../modules/utilsSabre')
const { makeSabreFlightCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')
const { suggestFlights } = require('../../modules/suggestions')
const convert = require('xml-js')
router.post(
  '/shopping',
  sabreCurrencyExchange,
  sabreToken,
  async (req, res) => {
    let search = req.body.search
    let cacheKey = makeSabreFlightCacheKey(search)

    try {
      let cacheData = await getCache(cacheKey)

      let flights = makeSabreFlightsData(
        cacheData.sabreRes,
        req.currency,
        cacheData.numberOfPassengers
      )

      let suggestData = suggestFlights(flights, req.body.trip, req.user)

      return res.status(200).send({
        ...suggestData,
        airlines: cacheData.airlines,
        airports: cacheData.airports,
        cacheKey
      })
    } catch (e) {
      // do nothing to run the try block below
    }

    try {
      // logger.info('req', data)

      let sabreRes = await apiSabre.shopping(
        makeSabreRequestData(search),
        req.sabreToken
      )
      sabreRes = sabreRes.data.groupedItineraryResponse

      let flights = makeSabreFlightsData(sabreRes, req.currency, search.adults)

      let airlines = []
      let airports = []

      flights.forEach(flight => {
        flight.departureSegments.forEach(segment => {
          airlines.push(segment.airline)
          airports.push(segment.departure)
          airports.push(segment.arrival)
        })
        flight.returnSegments.forEach(segment => {
          airlines.push(segment.airline)
          airports.push(segment.departure)
          airports.push(segment.arrival)
        })
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
        }),
        IataCity.aggregate([
          {
            $lookup: {
              from: 'cities',
              localField: 'city_id',
              foreignField: '_id',
              as: 'cities'
            }
          }
        ])
      ]).then(results => {
        let arrAirline = results[0]
        let airlines = {}
        arrAirline.forEach(airline => {
          airlines[airline._doc.iata] = airline
        })
        let arrAirport = results[1]
        let airports = {}
        arrAirport.forEach(airport => {
          airports[airport._doc.airport_code] = airport.toObject()
        })

        // add more iata city codes to airports
        results[2]
          .filter(ic => ic.cities.length > 0)
          .forEach(ic => {
            let airport = _.get(airports, `[${ic.city_code}]`, {})
            airports[ic.city_code] = {
              ...airport,
              city_name: _.get(ic, 'cities[0].name')
            }
          })

        let suggestData = suggestFlights(flights, req.body.trip, req.user)

        res.status(200).send({
          ...suggestData,
          airlines,
          airports,
          cacheKey
        })

        // save all data for using 1 hour later
        setCache(
          cacheKey,
          {
            sabreRes,
            numberOfPassengers: search.adults,
            airlines,
            airports
          },
          3600
        )
      })
    } catch (error) {
      return res.status(400).send()
    }
  }
)

router.get('/getSoap', async (req, res) => {
  try {
    let sabreRes = await apiSabre.getSoapSecurityToken()
    let result = convert.xml2json(sabreRes.data, { compact: true, spaces: 4 })
    let securityToken = _.get(
      JSON.parse(result),
      '[soap-env:Envelope][soap-env:Header][wsse:Security][wsse:BinarySecurityToken][_text]',
      'wrong'
    )
    return res.status(200).send(result)
  } catch (error) {
    return res.status(400).send(error.msg)
  }
})

module.exports = router
