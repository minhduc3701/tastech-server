const express = require('express')
const router = express.Router()
const Country = require('../models/country')
const { supportCurrenciesOptions } = require('../config/currency')

router.get('/countries', function(req, res, next) {
  Country.find({})
    .then(countries => {
      res.status(200).send({ countries })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/supportCurrencies', (req, res) => {
  res.status(200).send({
    currencies: supportCurrenciesOptions
  })
})

module.exports = router
