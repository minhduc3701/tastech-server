var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../models/voucher')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.get('/', async (req, res) => {
  try {
    Voucher.find({
      _buyer: req.user._id
    })
      .sort({ updatedAt: -1 })
      .then(voucher => {
        res.status(200).send({ vouchers: voucher })
      })
      .catch(e => {
        res.send({ error: 'Not Found' })
      })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/:id', async (req, res) => {
  Voucher.findById(req.params.id)
    .then(voucher => {
      res.status(200).send({ voucher })
    })
    .catch(e => {
      return res.status(400).send()
    })
})

module.exports = router
