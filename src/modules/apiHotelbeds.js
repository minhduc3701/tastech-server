const axios = require('axios')
const { generateHeader } = require('../config/hotelbeds')

const hotelbedsHttp = axios.create({
  baseURL: process.env.HOTELBEDS_URI
})

const endpoints = {
  hotels: '/hotel-api/1.0/hotels',
  hotelContents: '/hotel-content-api/1.0/hotels',
  checkRate: '/hotel-api/1.0/checkrates',
  bookings: '/hotel-api/1.0/bookings',
  facilities: '/hotel-content-api/1.0/types/facilities',
  facilityGroups: '/hotel-content-api/1.0/types/facilitygroups'
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
  },
  checkRate: request => {
    return hotelbedsHttp.post(`${endpoints.checkRate}`, request, {
      headers: generateHeader()
    })
  },
  createHotelbedsOrder: request => {
    return hotelbedsHttp.post(`${endpoints.bookings}`, request, {
      headers: generateHeader()
    })
  },
  cancelHotelbedsOrder: bookingReference => {
    return hotelbedsHttp.delete(
      `${endpoints.bookings}/${bookingReference}?cancellationFlag=CANCELLATION`,
      {
        headers: generateHeader()
      }
    )
  },
  getFacilities: () => {
    return hotelbedsHttp.get(
      `${endpoints.facilities}?fields=all&from=1&to=500`,
      {
        headers: generateHeader()
      }
    )
  },
  getFacilityGroups: () => {
    return hotelbedsHttp.get(
      `${endpoints.facilityGroups}?fields=all&from=1&to=100`,
      {
        headers: generateHeader()
      }
    )
  }
}

module.exports = api
