const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Ticket = require('../../models/ticket')
const zlib = require('zlib')
const request = require('request')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
router.post('/', (req, res) => {
  let ticket = new Ticket(req.body)

  ticket
    .save()
    .then(() => {
      res.status(200).send({
        errorCode: 0,
        errorMsg: 'ok'
      })
    })
    .catch(e => {
      res.status(400).send({
        errorCode: 1,
        errorMsg: 'Failure'
      })
    })
})

router.post('/shoppingV2', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      search: {
        adults: 1,
        children: 0,
        infants: 0,
        nonstop: 0,
        searchAirLegs: [
          {
            cabinClass: 'Economy',
            departureDate: '2019-11-07',
            destination: 'MEL',
            origin: 'HAN'
          }
        ],
        solutions: 0
      },
      authentication: {
        partnerId: 'P3kScN47kwu1+Rcj4JlgNdXqCzQ=',
        sign: 'f314b98e80370644fd11a95453930d2f'
      }
    })
  ).toString('base64')
  request(
    'https://open.pkfare.com/apitest/shoppingV2?param=' + base64,
    { encoding: null },
    function(err, response, body) {
      zlib.gunzip(body, function(err, dezipped) {
        res.send(JSON.parse(dezipped.toString()))
      })
    }
  )
})

router.post('/precisePricing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      pricing: {
        adults: 1,
        children: 0,
        infants: 0,
        journeys: {
          journey_0: [
            {
              airline: 'MH',
              arrival: 'SYD',
              arrivalDate: '2019-11-08',
              arrivalTime: '10:55',
              bookingCode: 'Y',
              departure: 'KUL',
              departureDate: '2019-11-07',
              departureTime: '23:35',
              flightNum: '123'
            }
          ]
        }
      },
      authentication: {
        partnerId: 'P3kScN47kwu1+Rcj4JlgNdXqCzQ=',
        sign: 'f314b98e80370644fd11a95453930d2f'
      }
    })
  ).toString('base64')
  request(
    'https://open.pkfare.com/apitest/precisePricing?param=' + base64,
    function(err, response, body) {
      res.send(JSON.parse(body))
    }
  )
})

router.post('/preciseBooking', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      booking: {
        passengers: [
          {
            birthday: '1990-04-25',
            cardExpiredDate: '2022-04-14',
            cardNum: '1234',
            cardType: 'P',
            firstName: 'Giang',
            lastName: 'Do',
            nationality: 'VN',
            psgType: 'ADT',
            sex: 'M'
          }
        ],
        solution: {
          adtFare: 0,
          adtTax: 0,
          infFare: 0,
          infTax: 0,
          journeys: {
            journey_0: [
              {
                airline: 'MH',
                arrival: 'SYD',
                arrivalDate: '2019-11-08',
                arrivalTime: '10:55',
                bookingCode: 'Y',
                departure: 'KUL',
                departureDate: '2019-11-07',
                departureTime: '23:35',
                flightNum: '123'
              }
            ]
          }
        }
      },
      authentication: {
        partnerId: 'P3kScN47kwu1+Rcj4JlgNdXqCzQ=',
        sign: 'f314b98e80370644fd11a95453930d2f'
      }
    })
  ).toString('base64')
  request(
    'https://open.pkfare.com/apitest/preciseBooking?param=' + base64,
    function(err, response, body) {
      res.send(JSON.parse(body))
    }
  )
})

router.post('/orderPricing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      orderPricing: {
        indicatorBIC: 0,
        isReBook: 0,
        orderNum: 1025001773
      },
      authentication: {
        partnerId: 'P3kScN47kwu1+Rcj4JlgNdXqCzQ=',
        sign: 'f314b98e80370644fd11a95453930d2f'
      }
    })
  ).toString('base64')
  request(
    'https://open.pkfare.com/apitest/orderPricing?param=' + base64,
    function(err, response, body) {
      res.send(JSON.parse(body))
    }
  )
})

router.post('/ticketing', (req, res) => {
  let base64 = Buffer.from(
    JSON.stringify({
      ticketing: {
        email: 'giang.do@tastech.asia',
        name: 'Giang',
        orderNum: 1025001773,
        pnr: 'UBV8OI',
        telNum: '12345678'
      },
      authentication: {
        partnerId: 'P3kScN47kwu1+Rcj4JlgNdXqCzQ=',
        sign: 'f314b98e80370644fd11a95453930d2f'
      }
    })
  ).toString('base64')
  request('https://open.pkfare.com/apitest/ticketing?param=' + base64, function(
    err,
    response,
    body
  ) {
    res.send(JSON.parse(body))
  })
})

module.exports = router
