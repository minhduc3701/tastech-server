const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const { makeHotelbedsHotelsData } = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')
const { getTasAdminOption } = require('../../middleware/options')
const { logger } = require('../../config/winston')
const { makeHotelBedsCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')
const { suggestHotelRooms } = require('../../modules/suggestions')
const _ = require('lodash')

router.post(
  '/hotels',
  getTasAdminOption,
  hotelbedsCurrencyExchange,
  async (req, res) => {
    let cacheKey = makeHotelBedsCacheKey(req.body.roomRequest)

    try {
      let data = await getCache(cacheKey)

      let hotelbedsHotelsData = makeHotelbedsHotelsData(
        data.hotels,
        data.rooms,
        req.currency,
        null,
        null,
        req.markupOptions.hotel
      )

      let suggestData = suggestHotelRooms(
        hotelbedsHotelsData,
        req.body,
        req.user
      )

      // for combo select room
      _.set(
        suggestData,
        'bestHotelRooms',
        suggestData.bestHotelRooms.map(room => ({
          ...room,
          cacheKey
        }))
      )

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
      let hotelIds = hotelbedsRoomsRes.data.hotels.hotels.map(
        hotel => hotel.code
      )
      const queryString = `fields=all&codes=${hotelIds.join(',')}&from=1&to=${
        hotelIds.length
      }`
      let hotelbedsHotelsRes = await api.getHotels(queryString)

      let hotelbedsHotelsData = makeHotelbedsHotelsData(
        hotelbedsHotelsRes.data.hotels,
        hotelbedsRoomsRes.data.hotels,
        req.currency,
        null,
        null,
        req.markupOptions.hotel
      )

      let suggestData = suggestHotelRooms(
        hotelbedsHotelsData,
        req.body,
        req.user
      )
      // for combo select room
      _.set(
        suggestData,
        'bestHotelRooms',
        suggestData.bestHotelRooms.map(room => ({
          ...room,
          cacheKey
        }))
      )

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
  }
)

router.post('/checkRate', async (req, res) => {
  const rateKey = req.body.rateKey
  const cacheKey = `checkRate-${rateKey}`

  try {
    let data = await getCache(cacheKey)

    if (data === 'NOT AVAILABLE') {
      return res
        .status(400)
        .send({ message: 'NOT AVAILABLE. Please do not try again.' })
    }

    return res.status(200).send({
      rate: _.get(data, 'hotel.rooms[0].rates[0]')
    })
  } catch (e) {
    // do nothing to run below query
  }

  try {
    let response = await api.checkRate({
      rooms: [
        {
          rateKey
        }
      ]
    })

    setCache(cacheKey, response.data)

    return res.status(200).send({
      rate: _.get(response, 'data.hotel.rooms[0].rates[0]')
    })
  } catch {
    setCache(cacheKey, 'NOT AVAILABLE')
  }

  res.status(400).send({
    message: 'NOT AVAILABLE'
  })
})

router.post('/rateCommentDetails', async (req, res) => {
  const rateCommentsId = req.body.rateCommentsId
  const checkInDate = req.body.checkInDate
  const cacheKey = `rateComments-${rateCommentsId}`

  try {
    let data = await getCache(cacheKey)
    let responseData = _.omit(data, 'auditData')
    let description = _.get(responseData, 'rateComments[0].description', '')

    return res.status(200).send({
      ...responseData,
      rateComments: {
        ..._.get(responseData, 'rateComments[0]'),
        description: _.replace(description, /\n/g, '<br/>')
      }
    })
  } catch (e) {
    // do nothing to run below query
  }

  try {
    let response = await api.fetchRateCommentDetails({
      code: rateCommentsId,
      date: checkInDate,
      fields: 'all',
      language: 'ENG',
      from: '1',
      to: '100',
      useSecondaryLanguage: 'True'
    })

    setCache(cacheKey, response.data)

    let responseData = _.omit(response.data, 'auditData')
    let description = _.get(responseData, 'rateComments[0].description', '')

    return res.status(200).send({
      ...responseData,
      rateComments: {
        ..._.get(responseData, 'rateComments[0]'),
        description: _.replace(description, /\n/g, '<br/>')
      }
    })
  } catch (e) {}

  res.status(400).send()
})

router.post(
  '/:id',
  hotelbedsCurrencyExchange,
  getTasAdminOption,
  async (req, res) => {
    let hotelId = req.params.id
    let cacheKey = makeHotelBedsCacheKey(req.body.roomRequest)

    try {
      let data = await getCache(cacheKey)

      let hotelbedsHotelsData = makeHotelbedsHotelsData(
        data.hotels,
        data.rooms,
        req.currency,
        data.facilities,
        data.facilityGroups,
        req.markupOptions.hotel
      )

      return res.status(200).send({
        hotel: hotelbedsHotelsData[0],
        cacheKey
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
        hotelFacilityGroupRes.data.facilityGroups,
        req.markupOptions.hotel
      )

      if (hotelbedsHotelsRes.data) {
        res.status(200).send({
          hotel: hotelbedsHotelsData[0],
          cacheKey
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
  }
)

module.exports = router
