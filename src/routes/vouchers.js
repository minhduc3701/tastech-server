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
    let perPage = parseInt(req.body.per_page)
    let page = Math.max(0, parseInt(req.body.page_no))

    let options = {
      _buyer: req.user._id,
      country: req.body.country
    }
    if (req.body.categoryName) {
      options['categoryName'] = req.body.categoryName
    }
    if (req.body.brand) {
      options['brand'] = req.body.brand
    }

    // @see https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
    Promise.all([
      Voucher.find(options)
        .limit(perPage)
        .skip(perPage * page)
        .sort({ updatedAt: -1 }),
      Voucher.countDocuments(options),
      Voucher.aggregate([
        {
          $group: {
            _id: '$country'
          }
        }
      ]),
      Voucher.aggregate([
        {
          $match: {
            country: req.body.country
          }
        },
        {
          $group: {
            _id: '$categoryName'
          }
        }
      ]),
      Voucher.aggregate([
        {
          $match: {
            country: req.body.country
          }
        },
        {
          $group: {
            _id: '$brand'
          }
        }
      ])
    ])
      .then(results => {
        let vouchers = results[0]
        let countries = []
        results[2].forEach(country => {
          if (country._id) {
            countries.push({
              value: country._id,
              label: country._id
            })
          }
        })

        let categories = []
        results[3].forEach(cat => {
          if (cat._id) {
            categories.push({
              value: cat._id,
              label: cat._id
            })
          }
        })
        categories.unshift({ value: '', label: 'All' })

        let brands = []
        results[4].forEach(brand => {
          if (brand._id) {
            brands.push({
              value: brand._id,
              label: brand._id
            })
          }
        })
        brands.unshift({ value: '', label: 'All' })

        let totalPage = Math.ceil(results[1] / perPage)

        res.status(200).send({
          countries,
          categories,
          brands,
          vouchers,
          total: results[1],
          totalPage
        })
      })
      .catch(error => {
        res.status(400).send()
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
