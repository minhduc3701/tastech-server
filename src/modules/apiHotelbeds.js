const axios = require('axios')
const { generateHeader } = require('../config/hotelbeds')

const hotelbedsHttp = axios.create({
  baseURL: process.env.HOTELBEDS_URI
})

const HOTELBEDS_CONTENT_VERSION = process.env.HOTELBEDS_CONTENT_VERSION
const HOTELBEDS_BOOKING_VERSION = process.env.HOTELBEDS_BOOKING_VERSION

const endpoints = {
  hotelContents: `/hotel-content-api/${HOTELBEDS_CONTENT_VERSION}/hotels`,
  facilities: `/hotel-content-api/${HOTELBEDS_CONTENT_VERSION}/types/facilities`,
  facilityGroups: `/hotel-content-api/${HOTELBEDS_CONTENT_VERSION}/types/facilitygroups`,
  hotels: `/hotel-api/${HOTELBEDS_CONTENT_VERSION}/hotels`,
  checkRate: `/hotel-api/${HOTELBEDS_CONTENT_VERSION}/checkrates`,
  bookings: `/hotel-api/${HOTELBEDS_BOOKING_VERSION}/bookings`, // required version 1.2 on production
  bookingsCancel: `/hotel-api/${HOTELBEDS_CONTENT_VERSION}/bookings` // 1.0 for cancel
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
      `${
        endpoints.bookingsCancel
      }/${bookingReference}?cancellationFlag=CANCELLATION`,
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
