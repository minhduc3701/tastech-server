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
    // get available hotelbeds rooms
    let { roomRequest } = req.body
    let hotelbedsRoomsRes = await api.getRooms(roomRequest)
    let hotelbedsRoomsData = makeHotelbedsRoomsData(
      hotelbedsRoomsRes.data.hotels.hotels,
      req.currency
    )

    // get appropriate hotelbeds hotel content, merge to available hotels
    let hotelIds = hotelbedsRoomsRes.data.hotels.hotels.map(hotel => hotel.code)
    const queryString = `fields=all&codes=${hotelIds.join(',')}&from=1&to=${
      hotelIds.length
    }`
    let hotelbedsHotelsRes = await api.getHotels(queryString)

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      hotelbedsHotelsRes.data.hotels,
      hotelbedsRoomsData,
      req.currency
    )

    if (hotelbedsRoomsRes.data) {
      res.status(200).send({
        hotels: hotelbedsHotelsData
      })
    }
  } catch (error) {
    res.status(400).send()
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
    .createHotelbedsOrder(request)
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
