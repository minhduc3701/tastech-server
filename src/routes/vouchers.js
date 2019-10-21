var express = require('express')
var router = express.Router()
const _ = require('lodash')
const { ObjectID } = require('mongodb')
const Country = require('../models/country')
const Voucher = require('../models/voucher')

router.get('/countryFilter', async (req, res) => {
  try {
    Promise.all([
      Country.find({}),
      Voucher.aggregate([
        {
          $match: {
            _buyer: req.user._id
          }
        },
        {
          $group: {
            _id: '$country'
          }
        }
      ])
    ])
      .then(results => {
        let fullCountryOptions = results[0]
        let voucherCountries = results[1]

        let countryOptions = []
        voucherCountries.forEach(country => {
          let matchCountry = fullCountryOptions.find(
            fullCountryOption => fullCountryOption.cca2 === country._id
          )
          if (matchCountry) {
            countryOptions.push({
              value: matchCountry.cca2,
              label: matchCountry.name.common
            })
          }
        })

        res.status(200).send({
          countries: countryOptions
        })
      })
      .catch(error => {
        res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

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
          $match: {
            _buyer: req.user._id
          }
        },
        {
          $group: {
            _id: '$country'
          }
        }
      ]),
      Voucher.aggregate([
        {
          $match: {
            _buyer: req.user._id,
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
            _buyer: req.user._id,
            country: req.body.country
          }
        },
        {
          $group: {
            _id: '$brand'
          }
        }
      ]),
      Country.find({})
    ])
      .then(results => {
        let vouchers = results[0]

        let fullCountryOptions = results[5]
        let voucherCountries = results[2]

        let countryOptions = []
        voucherCountries.forEach(country => {
          let matchCountry = fullCountryOptions.find(
            fullCountryOption => fullCountryOption.cca2 === country._id
          )
          if (matchCountry) {
            countryOptions.push({
              value: matchCountry.cca2,
              label: matchCountry.name.common
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
          countries: countryOptions,
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
