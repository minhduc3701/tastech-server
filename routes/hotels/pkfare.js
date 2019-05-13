const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const axios = require('axios')

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
      url: 'http://testhotelapi.pkfare.com/hotel/queryHotelList',
      data: {
        authentication,
        request: req.body.request
      }
    })
      .then(response => {
        if (response.data.body) {
          return res.status(200).send({
            hotels: response.data.body.hotelInfoList
          })
        }

        return Promise.reject()
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
      .catch(error => res.status(400).send())
  }
)

module.exports = router
