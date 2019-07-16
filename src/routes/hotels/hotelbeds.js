const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const {
  makeHotelbedsHotelsData,
  makeHotelbedsRoomsData
} = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')

router.post('/hotels', hotelbedsCurrencyExchange, async (req, res) => {
  try {
    const hotelRequest = req.body.hotelRequest
    const queryString = Object.keys(hotelRequest)
      .map(key => key + '=' + hotelRequest[key])
      .join('&')

    let hotelbedsHotelsRes = await api.getHotels(queryString)

    let hotelIds = hotelbedsHotelsRes.data.hotels.map(hotel => hotel.code)
    let roomRequest = req.body.roomRequest
    roomRequest.hotels.hotel = hotelIds

    let hotelbedsRoomsRes = await api.getRooms(roomRequest)
    let hotelbedsRoomsData = makeHotelbedsRoomsData(
      hotelbedsRoomsRes.data.hotels.hotels,
      req.currency
    )

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      hotelbedsHotelsRes.data.hotels,
      hotelbedsRoomsData,
      req.currency
    )

    if (hotelbedsHotelsRes.data) {
      res.status(200).send({
        hotels: hotelbedsHotelsData
      })
    }
  } catch (error) {
    res.status(400).send(error)
  }
})

router.get('/hotels/:id', (req, res) => {
  const hotelCode = req.params.id
  api
    .getHotelDetail(hotelCode)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/rooms', hotelbedsCurrencyExchange, (req, res) => {
  const request = req.body
  api
    .getRooms(request)
    .then(response => {
      if (response.data) {
        hotelbedsHotelsData = makeHotelbedsRoomsData(
          response.data.hotels.hotels,
          req.currency
        )
        res.status(200).send({
          hotels: hotelbedsHotelsData
        })
      }
    })
    .catch(error => {
      res.status(400).send({ message: '404 Bad request' })
    })
})

router.post('/checkRate', (req, res) => {
  const request = req.body
  api
    .checkRate(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/bookings', (req, res) => {
  const request = req.body
  api
    .bookings(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ data: response.data })
      }
    })
    .catch(error => {
      res.status(400).send(error.response.data)
    })
})

module.exports = router
