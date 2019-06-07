const express = require('express')
const router = express.Router()
const Country = require('../models/country')
const FlyerProgram = require('../models/flyerProgram')
const { supportCurrenciesOptions } = require('../config/currency')

router.get('/supportCurrencies', (req, res) => {
  res.status(200).send({
    currencies: supportCurrenciesOptions
  })
})

router.get('/countries', function(req, res, next) {
  Country.find({})
    .then(countries => {
      res.status(200).send({ countries })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/countriesOptions', (req, res) => {
  Country.find({}, 'cca2 name.common')
    .then(countries => {
      res.status(200).send({
        countries: countries.map(country => ({
          value: country.cca2,
          label: country.name.common
        }))
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/callingCodes', (req, res) => {
  Country.find({}, 'callingCode name.common')
    .then(countries => {
      res.status(200).send({
        callingCodes: countries
          .filter(country => country.callingCode.length > 0)
          .map(country => ({
            value: country.callingCode.join(', '),
            label: country.name.common
          }))
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/flyerPrograms', (req, res) => {
  FlyerProgram.find({})
    .then(flyerPrograms => {
      res.status(200).send({
        flyerPrograms: flyerPrograms.map(program => ({
          value: program.name,
          label: program.name
        }))
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
