const axios = require('axios')
const { generateHeader } = require('../config/hotelbeds')

const hotelbedsHttp = axios.create({
  baseURL: process.env.HOTELBEDS_URI
})

const endpoints = {
  hotels: '/hotel-api/1.0/hotels',
  hotelContents: '/hotel-content-api/1.0/hotels'
}

const api = {
  getHotels: queryString => {
    return hotelbedsHttp.get(`${endpoints.hotelContents}?${queryString}`, {
      headers: generateHeader()
    })
  },
  getHotelDetail: hotelCode => {
    return hotelbedsHttp.get(
      `${endpoints.hotelContents}/${hotelCode}/details?language=ENG`,
      { headers: generateHeader() }
    )
  },
  getRooms: request => {
    return hotelbedsHttp.post(`${endpoints.hotels}`, request, {
      headers: generateHeader()
    })
  }
}

module.exports = api
