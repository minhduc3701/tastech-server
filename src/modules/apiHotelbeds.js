const axios = require('axios')
const { headers } = require('../config/hotelbeds')

const hotelbedsHttp = axios.create({
  baseURL: process.env.HOTELBEDS_URI,
  headers: headers
})

const endpoints = {
  hotels: '/hotel-content-api/1.0/hotels'
}

const api = {
  getHotels: () => {
    return hotelbedsHttp.get(
      `${endpoints.hotels}?fields=all&language=ENG&from=1&to=50`
    )
  },
  getHotelDetail: hotelCode => {
    return hotelbedsHttp.get(
      `${endpoints.hotels}/${hotelCode}/details?language=ENG`
    )
  }
}

module.exports = api
