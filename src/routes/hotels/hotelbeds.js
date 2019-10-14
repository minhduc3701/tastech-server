const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const { makeHotelbedsHotelsData } = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')
const { logger } = require('../../config/winston')
const { makeHotelBedsCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')
const { suggestHotelRooms } = require('../../modules/suggestions')

router.post('/hotels', hotelbedsCurrencyExchange, async (req, res) => {
  let cacheKey = makeHotelBedsCacheKey(req.body.roomRequest)

  try {
    let data = await getCache(cacheKey)

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      data.hotels,
      data.rooms,
      req.currency
    )

    let suggestData = suggestHotelRooms(hotelbedsHotelsData, req.body, req.user)

    return res.status(200).send({
      ...suggestData,
      cacheKey
    })
  } catch (e) {
    // do nothing to run below query
  }

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

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      hotelbedsHotelsRes.data.hotels,
      hotelbedsRoomsRes.data.hotels,
      req.currency
    )

    let suggestData = suggestHotelRooms(hotelbedsHotelsData, req.body, req.user)

    if (hotelbedsRoomsRes.data) {
      res.status(200).send({
        ...suggestData,
        cacheKey
      })
    }

    // cached for using 1 hour later
    setCache(
      cacheKey,
      {
        hotels: hotelbedsHotelsRes.data.hotels,
        rooms: hotelbedsRoomsRes.data.hotels
      },
      3600
    )
  } catch (error) {
    res.status(400).send()
  }
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
  let hotelId = req.params.id
  let cacheKey = makeHotelBedsCacheKey(req.body.roomRequest)

  try {
    let data = await getCache(cacheKey)

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      data.hotels,
      data.rooms,
      req.currency,
      data.facilities,
      data.facilityGroups
    )

    return res.status(200).send({
      hotel: hotelbedsHotelsData[0]
    })
  } catch (e) {
    // do nothing to run below query
  }

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

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      hotelbedsHotelsRes.data.hotels,
      hotelbedsRoomsRes.data.hotels,
      req.currency,
      hotelFacilityRes.data.facilities,
      hotelFacilityGroupRes.data.facilityGroups
    )

    if (hotelbedsHotelsRes.data) {
      res.status(200).send({
        hotel: hotelbedsHotelsData[0]
      })
    }

    // cached for using 1 hour later
    setCache(
      cacheKey,
      {
        hotels: hotelbedsHotelsRes.data.hotels,
        rooms: hotelbedsRoomsRes.data.hotels,
        facilities: hotelFacilityRes.data.facilities,
        facilityGroups: hotelFacilityGroupRes.data.facilityGroups
      },
      3600
    )
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
