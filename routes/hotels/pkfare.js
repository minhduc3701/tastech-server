const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const axios = require('axios')
const Hotel = require('../../models/hotel')
const HotelImage = require('../../models/hotelImage')
const HotelPolicy = require('../../models/hotelPolicy')
const HotelAmenity = require('../../models/hotelAmenity')
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
            _id: { $in: hotelIds }
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
      let hotelList = results[0]
      let hotels = results[1]
      let hotelImages = results[2]
      let hotelPolicies = results[3]
      let hotelAmenities = results[4]
      let hotelDescriptions = results[5]
      let hotelTransportations = results[6]

      let newHotels = hotels.map(hotel => {
        let matchingHotel = hotelList.find(
          hotelApi => parseInt(hotelApi.hotelId) === hotel._id
        )
        let images = hotelImages.filter(image => image.hotelId === hotel._id)
        let policies = hotelPolicies.filter(
          policy => policy.hotelId === hotel._id
        )
        let amenities = hotelAmenities.filter(
          amenity => amenity.hotelId === hotel._id
        )
        let description = hotelDescriptions.filter(
          desc => desc.hotelId === hotel._id
        )
        let transportations = hotelTransportations.filter(
          trans => trans.hotelId === hotel._id
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

router.post('/hotelRatePlan', (req, res) => {
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
        return res.status(200).send({
          hotel: response.data.body
        })
      }

      return Promise.reject()
    })
    .catch(error => res.status(400).send())
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
