const express = require('express')
const router = express.Router()
const _ = require('lodash')
const passport = require('passport')
const Ticket = require('../../models/ticket')
const zlib = require('zlib')
const request = require('request')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
router.post('/', (req, res) => {
  let ticket = new Ticket(req.body)

  ticket
    .save()
    .then(() => {
      res.status(200).send({
        errorCode: 0,
        errorMsg: 'ok'
      })
    })
    .catch(e => {
      res.status(400).send({
        errorCode: 1,
        errorMsg: 'Failure'
      })
    })
})

const authentication = {
  partnerId: process.env.PKFARE_PARTNER_ID,
  sign: process.env.PKFARE_SIGN
}

router.post(
  '/shopping',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        search: req.body.search,
        authentication
      })
    ).toString('base64')
    request(
      `${process.env.PKFARE_URI}/shoppingV2?param=${base64}`,
      { encoding: null },
      function(err, response, body) {
        if (err) {
          return res.status(400).send()
        }

        zlib.gunzip(body, function(err, dezipped) {
          res.status(200).send(JSON.parse(dezipped.toString()))
        })
      }
    )
  }
)

router.post(
  '/precisePricing',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        pricing: req.body.pricing,
        authentication
      })
    ).toString('base64')
    request(
      `${process.env.PKFARE_URI}/precisePricing_V2?param=${base64}`,
      function(err, response, body) {
        if (err) {
          return res.status(400).send()
        }

        res.status(200).send(JSON.parse(body))
      }
    )
  }
)

router.post(
  '/penalty',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        penalty: req.body.penalty,
        authentication
      })
    ).toString('base64')
    request(`${process.env.PKFARE_URI}/penalty?param=${base64}`, function(
      err,
      response,
      body
    ) {
      if (err) {
        return res.status(400).send()
      }

      res.status(200).send(JSON.parse(body))
    })
  }
)

router.post(
  '/preciseBooking',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        booking: req.body.booking,
        authentication
      })
    ).toString('base64')
    request(
      `${process.env.PKFARE_URI}/preciseBooking?param=${base64}`,
      function(err, response, body) {
        if (err) {
          return res.status(400).send()
        }

        res.status(200).send(JSON.parse(body))
      }
    )
  }
)

router.post(
  '/cancel',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        cancel: req.body.cancel,
        authentication
      })
    ).toString('base64')
    request(`${process.env.PKFARE_URI}/cancel?param=${base64}`, function(
      err,
      response,
      body
    ) {
      if (err) {
        return res.status(400).send()
      }

      res.status(200).send(JSON.parse(body))
    })
  }
)

router.post(
  '/orderPricing',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        orderPricing: req.body.orderPricing,
        authentication
      })
    ).toString('base64')
    request(`${process.env.PKFARE_URI}/orderPricing?param=${base64}`, function(
      err,
      response,
      body
    ) {
      if (err) {
        return res.status(400).send()
      }

      res.status(200).send(JSON.parse(body))
    })
  }
)

router.post(
  '/ticketing',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let base64 = Buffer.from(
      JSON.stringify({
        ticketing: req.body.ticketing,
        authentication
      })
    ).toString('base64')
    request(`${process.env.PKFARE_URI}/ticketing?param=${base64}`, function(
      err,
      response,
      body
    ) {
      if (err) {
        return res.status(400).send()
      }

      res.status(200).send(JSON.parse(body))
    })
  }
)

module.exports = router
