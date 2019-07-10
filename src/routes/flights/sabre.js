const axios = require('axios')
const express = require('express')
const router = express.Router()
const { authentication } = require('../../config/sabre')
const apiSabre = require('../../modules/apiSabre')
const moment = require('moment')
const Airline = require('../../models/airline')
const Airport = require('../../models/airport')
const IataCity = require('../../models/iataCity')
const _ = require('lodash')
const { currencyExchange } = require('../../middleware/currency')
const { sabreToken } = require('../../middleware/sabre')
const { makeSabreFlightsData } = require('../../modules/utils')

router.post('/shopping', currencyExchange, sabreToken, async (req, res) => {
  let isRoundTrip = req.body.searchAirLegs.length === 2
  let OriginDestinationInformation = [
    {
      DepartureDateTime: req.body.searchAirLegs[0].departureDate,
      DestinationLocation: {
        LocationCode: req.body.searchAirLegs[0].destination
      },
      OriginLocation: {
        LocationCode: req.body.searchAirLegs[0].origin
      },
      TPA_Extensions: {
        CabinPref: {
          Cabin: req.body.cabinClass
        }
      }
    }
  ]
  if (isRoundTrip) {
    OriginDestinationInformation.push({
      DepartureDateTime: req.body.searchAirLegs[1].departureDate,
      DestinationLocation: {
        LocationCode: req.body.searchAirLegs[1].destination
      },
      OriginLocation: {
        LocationCode: req.body.searchAirLegs[1].origin
      },
      TPA_Extensions: {
        CabinPref: {
          Cabin: req.body.cabinClass
        }
      }
    })
  }
  let data = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation,
      POS: {
        Source: [
          {
            PseudoCityCode: 'F9CE',
            RequestorID: {
              CompanyName: {
                Code: 'TN'
              },
              ID: '1',
              Type: '1'
            }
          }
        ]
      },
      TravelerInfoSummary: {
        AirTravelerAvail: [
          {
            PassengerTypeQuantity: [
              {
                Code: 'ADT',
                Quantity: req.body.adults
              }
            ]
          }
        ],
        SeatsRequested: [1]
      },
      Version: '1'
    }
  }
  try {
    let sabreRes = await apiSabre.shopping(data, req.sabreToken)
    sabreRes = sabreRes.data.groupedItineraryResponse
    let { itineraryGroups } = sabreRes
    let flights = makeSabreFlightsData(itineraryGroups, sabreRes, req)
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
        airports[airport._doc.airport_code] = airport
      })

      // add more iata city codes to airports
      results[2]
        .filter(ic => ic.cities.length > 0)
        .forEach(ic => {
          airports[ic.city_code] = {
            city_name: _.get(ic, 'cities[0].name')
          }
        })

      res.status(200).send({
        flights,
        airlines,
        airports
      })
    })
  } catch (error) {
    // console.log(error)
    return res.status(400).send()
  }
})

module.exports = router
