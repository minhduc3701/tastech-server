const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const { makeHotelbedsHotelsData, markupHotels } = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')
const { findUserPolicy } = require('../../middleware/policies')
const { findCompletedOrders } = require('../../middleware/suggestions')
const { getTasAdminOptions } = require('../../middleware/options')
const { isPartnerBooking } = require('../../middleware/partnerAdmin')
const { logger } = require('../../config/winston')
const { makeHotelBedsCacheKey } = require('../../modules/cache')
const { getCache, setCache } = require('../../config/cache')
const { suggestHotelRooms } = require('../../modules/suggestions')
const _ = require('lodash')

const hideRoomOriginalPrices = room =>
  _.omit(room, ['net', 'rawNet', 'ratePlans', 'cancellationPolicies'])

const hideHotelsOriginalPrices = data => {
  let suggestData = { ...data }
  suggestData.hotels = suggestData.hotels.map(hotel =>
    _.omit(hotel, ['ratePlans'])
  )
  suggestData.bestHotelRooms = suggestData.bestHotelRooms.map(
    hideRoomOriginalPrices
  )
  return suggestData
}

const hideSingleHotelOriginalPrices = data => {
  let hotels = [...data]
  hotels.forEach(hotel => {
    _.set(
      hotel,
      'ratePlans.ratePlanList',
      _.get(hotel, 'ratePlans.ratePlanList', []).map(hideRoomOriginalPrices)
    )
  })
  return hotels
}

router.post(
  '/hotels',
  isPartnerBooking,
  getTasAdminOptions,
  findUserPolicy,
  findCompletedOrders,
  hotelbedsCurrencyExchange,
  async (req, res) => {
    let cacheKey = makeHotelBedsCacheKey(req.body.roomRequest)

    try {
      let data = await getCache(cacheKey)

      let hotelbedsHotelsData = makeHotelbedsHotelsData(
        data.hotels,
        data.rooms,
        req.currency
      )
      hotelbedsHotelsData = markupHotels(
        hotelbedsHotelsData,
        req.currency,
        req.markupOptions.hotel.value
      )

      let suggestData = suggestHotelRooms(
        hotelbedsHotelsData,
        req.body,
        req.user,
        req.policy,
        req.bookedHotels
      )

      suggestData = hideHotelsOriginalPrices(suggestData)

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
        req.currency
      )
      hotelbedsHotelsData = markupHotels(
        hotelbedsHotelsData,
        req.currency,
        req.markupOptions.hotel.value
      )

      let suggestData = suggestHotelRooms(
        hotelbedsHotelsData,
        req.body,
        req.user,
        req.policy,
        req.bookedHotels
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

      suggestData = hideHotelsOriginalPrices(suggestData)

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
      rate: _.pick(_.get(data, 'hotel.rooms[0].rates[0]'), 'rateComments')
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
      rate: _.pick(
        _.get(response, 'data.hotel.rooms[0].rates[0]'),
        'rateComments'
      )
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
  isPartnerBooking,
  hotelbedsCurrencyExchange,
  getTasAdminOptions,
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
        data.facilityGroups
      )
      hotelbedsHotelsData = markupHotels(
        hotelbedsHotelsData,
        req.currency,
        req.markupOptions.hotel.value
      )

      // hide original room prices
      hotelbedsHotelsData = hideSingleHotelOriginalPrices(hotelbedsHotelsData)

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
        hotelFacilityGroupRes.data.facilityGroups
      )
      hotelbedsHotelsData = markupHotels(
        hotelbedsHotelsData,
        req.currency,
        req.markupOptions.hotel.value
      )

      // hide original room prices
      hotelbedsHotelsData = hideSingleHotelOriginalPrices(hotelbedsHotelsData)

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
