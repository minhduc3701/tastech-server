const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const axios = require('axios')
const Hotel = require('../../models/hotel')
const HotelImage = require('../../models/hotelImage')
const HotelPolicy = require('../../models/hotelPolicy')
const HotelAmenity = require('../../models/hotelAmenity')
const HotelAmenityType = require('../../models/hotelAmenityType')
const HotelDescription = require('../../models/hotelDescription')
const HotelTransportation = require('../../models/hotelTransportation')
const { ObjectID } = require('mongodb')
const { authentication } = require('../../config/pkfare')
const { currencyExchange } = require('../../middleware/currency')

router.post('/hotelList', currencyExchange, (req, res) => {
  axios({
    method: 'post',
    url: `${process.env.PKFARE_HOTEL_URI}/queryHotelList`,
    data: {
      authentication,
      request: req.body.request
    }
  })
    .then(response => {
      if (response.data.body) {
        let hotelList = response.data.body.hotelInfoList
        let hotelIds = hotelList.map(hotel => parseInt(hotel.hotelId))

        return Promise.all([
          hotelList,
          Hotel.find({
            hotelId: { $in: hotelIds },
            language: 'en_US'
          }),
          HotelImage.find({
            hotelId: { $in: hotelIds }
          }),
          HotelPolicy.find({
            hotelId: { $in: hotelIds }
          }),
          HotelAmenity.find({
            hotelId: { $in: hotelIds }
          }),
          HotelDescription.find({
            hotelId: { $in: hotelIds }
          }),
          HotelTransportation.find({
            hotelId: { $in: hotelIds }
          })
        ])
      }
    })
    .then(results => {
      let amenityIds = _.uniq(results[4].map(amenity => amenity.amenityId))

      return Promise.all([
        ...results,
        HotelAmenityType.find({
          amenityId: { $in: amenityIds }
        })
      ])
    })
    .then(results => {
      let hotelList = results[0]
      let hotels = results[1]
      let hotelImages = results[2]
      let hotelPolicies = results[3]
      let hotelAmenities = results[4]
      let hotelDescriptions = results[5]
      let hotelTransportations = results[6]
      let hotelAmenityTypes = results[7]

      let newHotels = hotels.map(hotel => {
        let matchingHotel = hotelList.find(
          hotelApi => parseInt(hotelApi.hotelId) === hotel.hotelId
        )
        let images = hotelImages.filter(
          image => image.hotelId === hotel.hotelId
        )
        let policies = hotelPolicies.filter(
          policy => policy.hotelId === hotel.hotelId
        )
        let amenities = hotelAmenities.filter(
          amenity => amenity.hotelId === hotel.hotelId
        )
        amenities = _.uniqBy(amenities, amenity => amenity.amenityId)
        amenities = amenities.map(amenity => {
          let type = hotelAmenityTypes.find(
            type => type.amenityId === amenity.amenityId
          )

          if (!type) {
            type = {
              groupId: 0,
              groupName: 'Others',
              groupType: 'others'
            }
          } else {
            type = type.toObject()
          }

          return {
            ...amenity.toObject(),
            ...type
          }
        })
        let description = hotelDescriptions.filter(
          desc => desc.hotelId === hotel.hotelId
        )
        let transportations = hotelTransportations.filter(
          trans => trans.hotelId === hotel.hotelId
        )

        return {
          ...hotel.toObject(),
          currency: req.currency.code,
          lowestPrice: matchingHotel.lowestPrice * req.currency.rate,
          supplier: 'pkfare',
          images,
          policies,
          amenities,
          description,
          transportations
        }
      })
      res.status(200).send({ hotels: newHotels })
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/hotelRatePlan', currencyExchange, (req, res) => {
  axios({
    method: 'post',
    url: `${process.env.PKFARE_HOTEL_URI}/queryHotelRatePlan`,
    data: {
      authentication,
      request: req.body.request
    }
  })
    .then(response => {
      if (response.data.body) {
        let ratePlans = response.data.body
        ratePlans.ratePlanList = ratePlans.ratePlanList.map(room => ({
          ...room,
          cancelRules: room.cancelRules.map(rule => ({
            ...rule,
            cancelCharge: rule.cancelCharge * req.currency.rate
          })),
          dailyPriceList: room.dailyPriceList.map(daily => ({
            ...daily,
            salePrice: daily.salePrice * req.currency.rate
          })),
          totalPrice: room.totalPrice * req.currency.rate,
          rawTotalPrice: room.totalPrice,
          currency: req.currency.code
        }))
        return res.status(200).send({
          ratePlans
        })
      }

      return Promise.reject()
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/hotelsRatePlan', currencyExchange, (req, res) => {
  axios({
    method: 'post',
    url: `${process.env.PKFARE_HOTEL_URI}/queryMultipleHotelRatePlan`,
    data: {
      authentication,
      request: req.body.request
    }
  })
    .then(response => {
      if (response.data.body) {
        let ratePlans = response.data.body

        ratePlans.ratePlanList = ratePlans.ratePlanList.map(plan => ({
          ...plan,
          ratePlanDetailList: plan.ratePlanDetailList.map(room => ({
            ...room,
            cancelRules: room.cancelRules.map(rule => ({
              ...rule,
              cancelCharge: rule.cancelCharge * req.currency.rate
            })),
            dailyPriceList: room.dailyPriceList.map(daily => ({
              ...daily,
              salePrice: daily.salePrice * req.currency.rate
            })),
            totalPrice: room.totalPrice * req.currency.rate,
            rawTotalPrice: room.totalPrice,
            currency: req.currency.code
          }))
        }))

        return res.status(200).send({
          ratePlans
        })
      }

      return Promise.reject()
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/preBooking', (req, res) => {
  axios({
    method: 'post',
    url: `${process.env.PKFARE_HOTEL_URI}/preBooking`,
    data: {
      authentication,
      request: req.body.request
    }
  })
    .then(response => {
      if (response.data.body) {
        return res.status(200).send({
          data: response.data.body
        })
      }

      return Promise.reject()
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/createOrder', (req, res) => {
  axios({
    method: 'post',
    url: `${process.env.PKFARE_HOTEL_URI}/createOrder`,
    data: {
      authentication,
      request: req.body.request
    }
  })
    .then(response => {
      if (response.data) {
        return res.status(200).send({
          data: response.data
        })
      }

      return Promise.reject()
    })
    .catch(error => {
      res.status(400).send()
    })
})

module.exports = router
