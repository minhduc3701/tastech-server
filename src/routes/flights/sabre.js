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

router.post('/shopping', currencyExchange, async (req, res) => {
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
  console.log(OriginDestinationInformation)
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
    let sabreRes = await apiSabre.shopping(data)
    sabreRes = sabreRes.data.groupedItineraryResponse
    let { itineraryGroups } = sabreRes
    let flights = []
    itineraryGroups.map(l => {
      l.itineraries.map(i => {
        let obj = {
          legs: i.legs
        }
        obj.departureDescs = sabreRes.legDescs.find(
          leg => leg.id === i.legs[0].ref
        )
        obj.departureSegments = []
        obj.departureDescs.schedules.map(s => {
          let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
          obj.departureSegments.push({
            id: data.id,
            departure: data.departure.airport,
            arrival: data.arrival.airport,
            strDepartureTime: data.departure.time.substring(0, 5),
            strArrivalTime: data.arrival.time.substring(0, 5),
            flightNum: data.carrier.marketingFlightNumber,
            flightTime: moment(data.arrival.time.substring(0, 5), 'hh:mm').diff(
              moment(data.departure.time.substring(0, 5), 'hh:mm'),
              'minutes'
            ),
            airline: data.carrier.marketing
          })
        })
        obj.departureFlight = {
          flightId: ''
        }
        obj.departureSegments.forEach(s => {
          if (obj.departureFlight.flightId === '') {
            obj.departureFlight.flightId += `${s.flightNum}-${s.airline}`
          } else {
            obj.departureFlight.flightId += `-${s.flightNum}-${s.airline}`
          }
        })

        obj.returnDescs = {}
        obj.returnSegments = []
        obj.returnFlight = {}
        if (i.legs.length === 2) {
          obj.returnDescs = sabreRes.legDescs.find(
            leg => leg.id === i.legs[1].ref
          )
          obj.returnSegments = []
          obj.returnDescs.schedules.map(s => {
            let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
            obj.returnSegments.push({
              id: data.id,
              departure: data.departure.airport,
              arrival: data.arrival.airport,
              strDepartureTime: data.departure.time.substring(0, 5),
              strArrivalTime: data.arrival.time.substring(0, 5),
              flightNum: data.carrier.marketingFlightNumber,
              flightTime: moment(
                data.arrival.time.substring(0, 5),
                'hh:mm'
              ).diff(
                moment(data.departure.time.substring(0, 5), 'hh:mm'),
                'minutes'
              ),
              airline: data.carrier.marketing
            })
          })
          obj.returnFlight = {
            flightId: ''
          }
          obj.returnSegments.forEach(s => {
            if (obj.returnFlight.flightId === '') {
              obj.returnFlight.flightId += `${s.flightNum}-${s.airline}`
            } else {
              obj.returnFlight.flightId += `-${s.flightNum}-${s.airline}`
            }
          })
        }

        obj.rawCurrency = i.pricingInformation[0].fare.totalFare.currency
        obj.rawTotalPrice = i.pricingInformation[0].fare.totalFare.totalPrice
        obj.currency = req.currency.code
        obj.totalPrice = obj.rawTotalPrice * req.currency.rate
        obj.price = obj.rawTotalPrice * req.currency.rate
        obj.supplier = 'sabre'

        flights.push(obj)
      })
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
