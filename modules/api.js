const axios = require('axios')
const { authentication } = require('../config/pkfare')
const zlib = require('zlib')
const request = require('request')

const flightHttp = axios.create({
  baseURL: process.env.PKFARE_URI
})

const hotelHttp = axios.create({
  baseURL: process.env.PKFARE_HOTEL_URI
})

const endpoints = {
  preciseBooking: 'preciseBooking',
  ticketing: 'ticketing',
  createOrder: 'createOrder',
  shopping: 'shopping'
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
    return flightHttp.get(`${endpoints.preciseBooking}?param=${base64}`)
  },
  ticketing: ticketing => {
    let base64 = Buffer.from(
      JSON.stringify({
        ticketing,
        authentication
      })
    ).toString('base64')
    return flightHttp.get(`${endpoints.ticketing}?param=${base64}`)
  },
  createHotelOrder: request => {
    return hotelHttp.post(`${endpoints.createOrder}`, {
      authentication,
      request
    })
  }
}

module.exports = api
