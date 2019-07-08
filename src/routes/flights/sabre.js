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

const makeFlightSegmentData = segment => {
  let data = []
  segment.map(e => {
    data.push({
      departure: e.DepartureAirport.LocationCode,
      arrival: e.ArrivalAirport.LocationCode,
      strDepartureDate: moment(e.DepartureDateTime).format('YYYY-MM-DD'),
      strDepartureTime: moment(e.DepartureDateTime).format('HH:mm'),
      strArrivalDate: moment(e.ArrivalDateTime).format('YYYY-MM-DD'),
      strArrivalTime: moment(e.ArrivalDateTime).format('HH:mm'),
      flightNum: e.FlightNumber,
      flightTime: e.ElapsedTime,
      airline: e.OperatingAirline.Code
    })
  })
  return data
}
router.post('/shopping', currencyExchange, async (req, res) => {
  let data = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation: [
        {
          DepartureDateTime: '2019-07-21T00:00:00',
          DestinationLocation: {
            LocationCode: 'LAX'
          },
          OriginLocation: {
            LocationCode: 'NYC'
          },
          TPA_Extensions: {
            CabinPref: {
              Cabin: 'F'
            }
          }
        },
        {
          DepartureDateTime: '2019-07-22T00:00:00',
          DestinationLocation: {
            LocationCode: 'NYC'
          },
          OriginLocation: {
            LocationCode: 'LAX'
          },
          TPA_Extensions: {
            CabinPref: {
              Cabin: 'F'
            }
          }
        }
      ],
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
                Quantity: 1
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
    let sabreRes = await apiSabre.shopping(data)
    let list =
      sabreRes.data.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary
    let flights = []
    list.map(f => {
      let obj = {}
      obj.departureSegments = makeFlightSegmentData(
        f.AirItinerary.OriginDestinationOptions.OriginDestinationOption[0]
          .FlightSegment
      )
      obj.returnSegments = []
      if (f.AirItinerary.DirectionInd === 'Return') {
        obj.returnSegments = makeFlightSegmentData(
          f.AirItinerary.OriginDestinationOptions.OriginDestinationOption[1]
            .FlightSegment
        )
      }
      obj.rawCurrency =
        f.AirItineraryPricingInfo[0].ItinTotalFare.TotalFare.CurrencyCode
      obj.rawTotalPrice =
        f.AirItineraryPricingInfo[0].ItinTotalFare.TotalFare.Amount
      obj.supplier = 'sabre'
      ;(obj.currency = req.currency.code),
        (obj.totalPrice = obj.rawTotalPrice * req.currency.rate)
      obj.price = obj.rawTotalPrice * req.currency.rate
      flights.push(obj)
    })
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
    console.log(error)
    return res.status(400).send()
  }
})

module.exports = router
