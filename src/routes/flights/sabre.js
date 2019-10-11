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
const { giamsoAirlines } = require('../../modules/utils')
const { makeSabreFlightCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')

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

      flights = smartSuggestionFlights(flights)

      return res.status(200).send({
        flights,
        airlines: cacheData.airlines,
        airports: cacheData.airports
      })
    } catch (e) {
      // do nothing to run the try block below
    }

    let isRoundTrip = search.searchAirLegs.length === 2
    let OriginDestinationInformation = [
      {
        DepartureDateTime: search.searchAirLegs[0].departureDate,
        DestinationLocation: {
          LocationCode: search.searchAirLegs[0].destination
        },
        OriginLocation: {
          LocationCode: search.searchAirLegs[0].origin
        },
        TPA_Extensions: {
          CabinPref: {
            Cabin: search.cabinClass
          }
        }
      }
    ]
    if (isRoundTrip) {
      OriginDestinationInformation.push({
        DepartureDateTime: search.searchAirLegs[1].departureDate,
        DestinationLocation: {
          LocationCode: search.searchAirLegs[1].destination
        },
        OriginLocation: {
          LocationCode: search.searchAirLegs[1].origin
        },
        TPA_Extensions: {
          CabinPref: {
            Cabin: search.cabinClass
          }
        }
      })
    }
    let VendorPref = []
    giamsoAirlines.map(airline => {
      VendorPref.push({
        Code: airline,
        PreferLevel: 'Only',
        Type: 'Operating'
      })
    })
    let data = {
      OTA_AirLowFareSearchRQ: {
        OriginDestinationInformation,
        POS: {
          Source: [
            {
              PseudoCityCode: '5EJJ',
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
        TPA_Extensions: {
          IntelliSellTransaction: {
            RequestType: {
              Name: '50ITINS'
            }
          }
        },
        TravelPreferences: {
          Baggage: {
            RequestType: 'C', // C: charge and allownce, A: only allownce
            Description: true,
            RequestedPieces: 2,
            FreePieceRequired: true
          },
          VendorPref
        },
        TravelerInfoSummary: {
          AirTravelerAvail: [
            {
              PassengerTypeQuantity: [
                {
                  Code: 'ADT',
                  Quantity: search.adults
                }
              ]
            }
          ],
          SeatsRequested: [search.adults]
        },
        Version: '1'
      }
    }
    try {
      logger.info('req', data)

      let sabreRes = await apiSabre.shopping(data, req.sabreToken)
      sabreRes = sabreRes.data.groupedItineraryResponse
      let { currency } = req

      let flights = makeSabreFlightsData(sabreRes, currency, search.adults)

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

        res.status(200).send({
          flights,
          airlines,
          airports
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

module.exports = router
