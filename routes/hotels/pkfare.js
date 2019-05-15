const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const axios = require('axios')
const Hotel = require('../../models/hotel')

const authentication = {
  partnerId: process.env.PKFARE_PARTNER_ID,
  sign: process.env.PKFARE_SIGN
}

router.post(
  '/hotelList',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_URI}/hotel/queryHotelList`,
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
            })
          ])
        }
      })
      .then(results => {
        let hotelList = results[0]
        let hotels = results[1]

        hotels.forEach(hotelDetail => {
          hotelList.forEach(hotel => {
            if (hotelDetail._id === Number(hotel.hotelId)) {
              hotelDetail['lowestPrice'] = hotel.lowestPrice
            }
          })
        })
        res.status(200).send({ hotels })
      })
      .catch(error => res.status(400).send())
  }
)

router.post(
  '/hotelRatePlan',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'post',
      url: `${process.env.PKFARE_URI}/hotel/queryHotelRatePlan`,
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
      url: `${process.env.PKFARE_URI}/hotel/preBooking`,
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
    console.log(`${process.env.PKFARE_URI}/hotel/createOrder`)
    console.log(req.body.request)
    axios({
      method: 'post',
      url: `${process.env.PKFARE_URI}/hotel/createOrder`,
      data: {
        authentication,
        request: req.body.request
      }
    })
      .then(response => {
        console.log('ok', response.data)
        if (response.data) {
          return res.status(200).send({
            data: response.data
          })
        }

        return Promise.reject()
      })
      .catch(error => {
        console.log('error')
        res.status(400).send(error)
      })
  }
)

module.exports = router
