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
const {
  sabreRestToken,
  sabreSoapSecurityToken
} = require('../../middleware/sabre')
const { makeSabreFlightsData, roundPrice } = require('../../modules/utils')
const { logger } = require('../../config/winston')
const { makeSabreRequestData } = require('../../modules/utilsSabre')
const { makeSabreFlightCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')
const { suggestFlights } = require('../../modules/suggestions')
const convert = require('xml-js')

router.post(
  '/shopping',
  sabreCurrencyExchange,
  sabreRestToken,
  async (req, res) => {
    let search = req.body.search
    let cacheKey = makeSabreFlightCacheKey(search)

    try {
      let cacheData = await getCache(cacheKey)
      // logger.info('Sabre shopping: ', cacheData.sabreRes)

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
        req.sabreRestToken
      )
      sabreRes = sabreRes.data.groupedItineraryResponse

      // logger.info('Sabre shopping: ', { sabreRes })
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

router.post(
  '/getFareRule',
  sabreCurrencyExchange,
  sabreSoapSecurityToken,
  async (req, res) => {
    try {
      let { sabreSoapSecurityToken } = req
      let { departureSegments, returnSegments, numberOfPassenger } = req.body

      let depatureFareBasisCodes = []
      departureSegments.map(segment =>
        depatureFareBasisCodes.push(segment.fareBasisCode)
      )
      depatureFareBasisCodes = _.uniq(depatureFareBasisCodes)

      let returnFareBasisCodes = []
      returnSegments.map(segment =>
        returnFareBasisCodes.push(segment.fareBasisCode)
      )
      returnFareBasisCodes = _.uniq(returnFareBasisCodes)

      let flightSegment = departureSegments.concat(returnSegments)

      let xml = `
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eb="http://www.ebxml.org/namespaces/messageHeader" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsd="http://www.w3.org/1999/XMLSchema">
    <SOAP-ENV:Header>
        <eb:MessageHeader SOAP-ENV:mustUnderstand="1" eb:version="1.0">
            <eb:ConversationId>1</eb:ConversationId>
            <eb:From>
                <eb:PartyId type="urn:x12.org:IO5:01">999999</eb:PartyId>
            </eb:From>
            <eb:To>
                <eb:PartyId type="urn:x12.org:IO5:01">123123</eb:PartyId>
            </eb:To>
            <eb:CPAId>${process.env.SABRE_USER_ID}</eb:CPAId>
            <eb:Service eb:type="OTA">StructureFareRulesRQ</eb:Service>
            <eb:Action>StructureFareRulesRQ</eb:Action>
        </eb:MessageHeader>
        <wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2002/12/secext">
            <wsse:BinarySecurityToken valueType="String" EncodingType="wsse:Base64Binary">${sabreSoapSecurityToken}</wsse:BinarySecurityToken>
        </wsse:Security>
    </SOAP-ENV:Header>
    <SOAP-ENV:Body>
        <StructureFareRulesRQ Version="1.0.4" xmlns="http://webservices.sabre.com/sabreXML/2003/07" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <PriceRequestInformation>
                <PassengerTypes>
                    <PassengerType Code="ADT" Count="${numberOfPassenger}" />
                </PassengerTypes>
                <ReturnAllData Value="1" />
                <FreeBaggageSubscriber Ind="true" />
            </PriceRequestInformation>
            <AirItinerary>
                <OriginDestinationOptions>
                   
                        `

      flightSegment.map((segment, index) => {
        let fareComponentNumber = 0
        if (index < departureSegments.length) {
          fareComponentNumber =
            depatureFareBasisCodes.findIndex(
              code => segment.fareBasisCode == code
            ) + 1
        } else {
          fareComponentNumber =
            returnFareBasisCodes.findIndex(
              code => segment.fareBasisCode == code
            ) +
            1 +
            depatureFareBasisCodes.length
        }
        // convert D: A, B, B  --- R: C, C, B
        // => A, B -- C, B
        // => 1, 2, 2 -- 3, 3, 4
        xml += `  <OriginDestinationOption>
                   <FlightSegment 
                    DepartureDate="${segment.departureDate}" 
                    ArrivalDate="${segment.arrivalDate}" 
                    BookingDate="${moment().format('YYYY-MM-DDThh:mm:ss')}" 
                    FlightNumber="${segment.flightNum}" 
                    ResBookDesigCode="${segment.bookingCode}" 
                    SegmentNumber="0${index + 1}" 
                    SegmentType="A" 
                    RealReservationStatus="SS">
                  <DepartureAirport LocationCode="${segment.departure}"/>
                  <ArrivalAirport LocationCode="${segment.arrival}"/>
                  <MarketingAirline Code="${segment.marketing}"/>
                  <OperatingAirline Code="${segment.operating}"/>
                    </FlightSegment>
                    <SegmentInformation SegmentNumber="0${index + 1}"/>
                      <PaxTypeInformation PassengerType="ADT" FareComponentNumber="${fareComponentNumber}" FareBasisCode="${
          segment.fareBasisCode
        }"/>
                </OriginDestinationOption>
                `
      })
      xml += ` 
              </OriginDestinationOptions>
          </AirItinerary>
      </StructureFareRulesRQ>
  </SOAP-ENV:Body>
  </SOAP-ENV:Envelope>`
      logger.info('sabreFareRule request: ', { xml })
      let sabreRes = await apiSabre.callSabreSoapAPI(xml)
      let jsonObjRes = convert.xml2json(sabreRes.data, {
        compact: true,
        spaces: 4
      })
      // logger.info('xml res: ', { data: sabreRes.data })

      let flightFareRuleRes = _.get(
        JSON.parse(jsonObjRes),
        "['soap-env:Envelope']['soap-env:Body']['StructureFareRulesRS']['Summary']['PassengerDetails']['PassengerDetail'][PenaltiesInfo][Penalty]",
        ''
      )
      // logger.info('jsonObjRes: ', { data: JSON.parse(jsonObjRes) })
      // logger.info('flightFareRuleRes: ', { data: flightFareRuleRes })

      let flightFareRule = []
      if (flightFareRuleRes && flightFareRuleRes.length !== 0) {
        if (
          _.get(flightFareRuleRes[2], '_attributes.Refundable', false) ===
          'true'
        ) {
          flightFareRule.push({
            time: moment(flightSegment[0].departureDate)
              .add(-1, 'hours')
              .format('LLL'),
            amount: roundPrice(
              _.get(flightFareRuleRes[2], '_attributes.Amount', 0) *
                req.currency.rate,
              req.currency.code
            ),
            rawAmount: _.get(flightFareRuleRes[2], '_attributes.Amount', 0),
            currency: req.currency.code,
            rawCurrency: _.get(
              flightFareRuleRes[2],
              '_attributes.CurrencyCode',
              ''
            )
          })
        }
        if (
          _.get(flightFareRuleRes[3], '_attributes.Refundable', false) ===
          'true'
        ) {
          flightFareRule.push({
            time: moment(flightSegment[0].departureDate)
              .add(1, 'hours')
              .format('LLL'),
            amount: roundPrice(
              _.get(flightFareRuleRes[3], '_attributes.Amount', 0) *
                req.currency.rate,
              req.currency.code
            ),
            rawAmount: _.get(flightFareRuleRes[3], '_attributes.Amount', 0),
            currency: req.currency.code,
            rawCurrency: _.get(
              flightFareRuleRes[3],
              '_attributes.CurrencyCode',
              ''
            )
          })
        }
      }
      return res.status(200).send({ flightFareRule })
    } catch (error) {
      return res.status(400).send(error.msg)
    }
  }
)

module.exports = router
