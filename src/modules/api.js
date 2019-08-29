const axios = require('axios')
const { authentication } = require('../config/pkfare')
const zlib = require('zlib')
const request = require('request')
const JSONbig = require('json-bigint')({ storeAsString: true })

const flightHttp = axios.create({
  baseURL: process.env.PKFARE_URI
})

const hotelHttp = axios.create({
  baseURL: process.env.PKFARE_HOTEL_URI
})

const jsonBigTransformOptions = {
  transformResponse: [data => JSONbig.parse(data)]
}

const endpoints = {
  preciseBooking: 'preciseBooking',
  ticketing: 'ticketing',
  createOrder: 'createOrder',
  shopping: 'shopping',
  orderPricing: 'orderPricing',
  voiding: 'voiding'
}

const api = {
  shopping: search => {
    let base64 = Buffer.from(
      JSON.stringify({
        search,
        authentication
      })
    ).toString('base64')

    return new Promise((resolve, reject) => {
      request(
        `${process.env.PKFARE_URI}/shoppingV2?param=${base64}`,
        { encoding: null },
        function(err, response, body) {
          if (err) {
            return reject({})
          }

          zlib.gunzip(body, function(err, dezipped) {
            if (err) {
              return reject({})
            }

            let flights = JSON.parse(dezipped.toString())
            flights = flights.data

            resolve(flights)
          })
        }
      )
    })
  },
  preciseBooking: booking => {
    let base64 = Buffer.from(
      JSON.stringify({
        booking,
        authentication
      })
    ).toString('base64')
    return flightHttp.get(
      `${endpoints.preciseBooking}?param=${base64}`,
      jsonBigTransformOptions
    )
  },
  ticketing: ticketing => {
    let base64 = Buffer.from(
      JSON.stringify({
        ticketing,
        authentication
      })
    ).toString('base64')
    return flightHttp.get(
      `${endpoints.ticketing}?param=${base64}`,
      jsonBigTransformOptions
    )
  },
  orderPricing: orderPricing => {
    let base64 = Buffer.from(
      JSON.stringify({
        orderPricing,
        authentication
      })
    ).toString('base64')
    return flightHttp.get(
      `${endpoints.orderPricing}?param=${base64}`,
      jsonBigTransformOptions
    )
  },
  voiding: voidRequest => {
    let base64 = Buffer.from(
      JSON.stringify({
        voidRequest,
        authentication
      })
    ).toString('base64')
    return flightHttp.get(
      `${endpoints.voiding}?param=${base64}`,
      jsonBigTransformOptions
    )
    // return axios.get(`http://localhost:5050/voiding?param=${base64}`, jsonBigTransformOptions)
  },
  createHotelOrder: request => {
    return hotelHttp.post(`${endpoints.createOrder}`, {
      authentication,
      request
    })
  },
  currency: currency => {
    return axios.get(
      `${process.env.TRANSFERWISE_URI}/v1/rates?source=${
        process.env.BASE_CURRENCY
      }&target=${currency}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`
        }
      }
    )
  },
  exchangeCurrency: (sourceCurrency, destinationCurrency) => {
    return axios.get(
      `${
        process.env.TRANSFERWISE_URI
      }/v1/rates?source=${sourceCurrency}&target=${destinationCurrency}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`
        }
      }
    )
  }
}

module.exports = api
