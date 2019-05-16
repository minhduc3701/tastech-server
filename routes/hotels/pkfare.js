const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const axios = require('axios')
const Hotel = require('../../models/hotel')
const HotelImage = require('../../models/hotelImages')
const { ObjectID } = require('mongodb')

const authentication = {
  partnerId: process.env.PKFARE_PARTNER_ID,
  sign: process.env.PKFARE_SIGN
}

router.get('/test', (req, res) => {
  HotelImage.find({})
    .then(images => res.status(200).send({ images }))
    .catch(e => res.status(400).send())
})

router.post(
  '/hotelList',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_HOTEL_URI}/hotel/queryHotelList`,
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
            Hotel.aggregate([
              {
                $match: {
                  _id: {
                    $in: hotelIds
                  }
                }
              },
              {
                $lookup: {
                  from: 'hotelImages',
                  localField: '_id',
                  foreignField: 'hotelId',
                  as: 'images'
                }
              }
            ])
          ])
        }
      })
      .then(results => {
        let hotelList = results[0]
        let hotels = results[1]

        let newHotels = hotels.map(hotel => {
          let matchingHotel = hotelList.find(
            hotelApi => parseInt(hotelApi.hotelId) === hotel._id
          )
          return {
            ...hotel,
            currency: matchingHotel.currency,
            lowestPrice: matchingHotel.lowestPrice
          }
        })
        res.status(200).send({ hotels: newHotels })
      })
      .catch(error => {
        res.status(400).send()
      })
  }
)

router.post(
  '/hotelRatePlan',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_HOTEL_URI}/hotel/queryHotelRatePlan`,
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
      .catch(error => res.status(400).send(error))
  }
)

router.post(
  '/preBooking',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_HOTEL_URI}/hotel/preBooking`,
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
      .catch(error => res.status(400).send(error))
  }
)

router.post(
  '/createOrder',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_HOTEL_URI}/hotel/createOrder`,
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
        res.status(400).send(error)
      })
  }
)

module.exports = router
