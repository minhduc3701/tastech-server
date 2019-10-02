var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../models/voucher')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.post('/', async (req, res) => {
  try {
    let perPage = req.body.per_page
    let page = Math.max(0, req.body.page_no)

    // @see https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
    Promise.all([
      Voucher.find({
        _buyer: req.user._id
      })
        .limit(perPage)
        .skip(perPage * page)
        .sort({ updatedAt: -1 }),
      Voucher.count({
        _buyer: req.user._id
      })
    ])
      .then(results => {
        let vouchers = results[0]
        let totalPage = Math.ceil(results[1] / perPage)
        res.status(200).send({
          vouchers,
          totalPage,
          total: results[1]
        })
      })
      .catch(e => res.status(400).send())
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
