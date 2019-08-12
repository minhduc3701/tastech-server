const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const {
  makeHotelbedsHotelsData,
  makeHotelbedsSingleHotelContent
} = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')
const { logger } = require('../../config/winston')

router.post('/hotels', hotelbedsCurrencyExchange, async (req, res) => {
  try {
    // get available hotelbeds rooms
    let { roomRequest } = req.body
    let hotelbedsRoomsRes = await api.getRooms(roomRequest)

    // get appropriate hotelbeds hotel content, merge to available hotels
    let hotelIds = hotelbedsRoomsRes.data.hotels.hotels.map(hotel => hotel.code)
    const queryString = `fields=all&codes=${hotelIds.join(',')}&from=1&to=${
      hotelIds.length
    }`
    let hotelbedsHotelsRes = await api.getHotels(queryString)

    let hotelbedsHotelsData = []
    if (hotelbedsRoomsRes.data.hotels.total > 0) {
      hotelbedsHotelsData = makeHotelbedsHotelsData(
        hotelbedsHotelsRes.data.hotels,
        hotelbedsRoomsRes.data.hotels.hotels,
        req.currency
      )
    } else {
      hotelbedsHotelsData = makeHotelbedsSingleHotelContent(
        hotelbedsHotelsRes.data.hotels,
        req.currency
      )
    }

    if (hotelbedsRoomsRes.data) {
      res.status(200).send({
        hotels: hotelbedsHotelsData
      })
    }
  } catch (error) {
    res.status(400).send()
  }
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

router.post('/:id', hotelbedsCurrencyExchange, async (req, res) => {
  hotelId = req.params.id
  try {
    // get available hotelbeds rooms
    let roomRequest = req.body.roomRequest

    // get appropriate hotelbeds hotel content, merge to available hotel
    const queryString = `fields=all&codes=${hotelId}`
    let hotelbedsHotelsRes = await api.getHotels(queryString)

    logger.info('AvailibilityRQ', roomRequest)

    let hotelbedsRoomsRes = await api.getRooms(roomRequest)

    logger.info('AvailibilityRS', hotelbedsRoomsRes.data)

    let hotelFacilityRes = await api.getFacilities()
    let hotelFacilityGroupRes = await api.getFacilityGroups()

    let hotelbedsHotelsData = []
    if (hotelbedsRoomsRes.data.hotels.total > 0) {
      hotelbedsHotelsData = makeHotelbedsHotelsData(
        hotelbedsHotelsRes.data.hotels,
        hotelbedsRoomsRes.data.hotels.hotels,
        req.currency,
        hotelFacilityRes.data.facilities,
        hotelFacilityGroupRes.data.facilityGroups
      )
    } else {
      hotelbedsHotelsData = makeHotelbedsSingleHotelContent(
        hotelbedsHotelsRes.data.hotels,
        req.currency
      )
    }

    if (hotelbedsHotelsRes.data) {
      res.status(200).send({
        hotel: hotelbedsHotelsData[0]
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
