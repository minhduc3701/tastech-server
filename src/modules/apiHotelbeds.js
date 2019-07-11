const axios = require('axios')
const { headers } = require('../config/hotelbeds')

const hotelbedsHttp = axios.create({
  baseURL: process.env.HOTELBEDS_URI,
  headers: headers
})

const endpoints = {
  hotels: '/hotel-api/1.0/hotels',
  hotelContents: '/hotel-content-api/1.0/hotels',
  checkRate: '/hotel-api/1.0/checkrates',
  bookings: '/hotel-api/1.0/bookings'
}

const api = {
  getHotels: queryString => {
    return hotelbedsHttp.get(`${endpoints.hotelContents}?${queryString}`)
  },
  getHotelDetail: hotelCode => {
    return hotelbedsHttp.get(
      `${endpoints.hotelContents}/${hotelCode}/details?language=ENG`
    )
  },
  getRooms: request => {
    return hotelbedsHttp.post(`${endpoints.hotels}`, request)
  },
  checkRate: request => {
    return hotelbedsHttp.post(`${endpoints.checkRate}`, request)
  },
  bookings: request => {
    return hotelbedsHttp.post(`${endpoints.bookings}`, request)
  }
}

module.exports = api
