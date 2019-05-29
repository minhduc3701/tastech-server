const axios = require('axios')
const { authentication } = require('../config/pkfare')

const flightHttp = axios.create({
  baseURL: process.env.PKFARE_URI
})

const hotelHttp = axios.create({
  baseURL: process.env.PKFARE_HOTEL_URI
})

const endpoints = {
  preciseBooking: 'preciseBooking',
  ticketing: 'ticketing',
  createOrder: 'createOrder'
}

const api = {
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
