const express = require('express')
const router = express.Router()
const Country = require('../models/country')
const FlyerProgram = require('../models/flyerProgram')
const {
  supportCurrenciesOptions,
  supportExpenseCurrenciesOptions
} = require('../config/currency')
const { languageOptions } = require('../config/language')
const { currentCompany } = require('../middleware/company')
const { currenciesExchange } = require('../middleware/currency')

router.get('/supportCurrencies', (req, res) => {
  res.status(200).send({
    currencies: supportCurrenciesOptions
  })
})

router.get('/languageOptions', (req, res) => {
  res.status(200).send({
    languages: languageOptions
  })
})

router.get('/supportCurrenciesWithRate', currentCompany, async (req, res) => {
  try {
    let currencies = await currenciesExchange()
    let options = supportExpenseCurrenciesOptions.map(sourceCurrency => {
      // if currency equal company currency => rate : 1
      if (sourceCurrency.code === req.company.currency) {
        return {
          ...sourceCurrency,
          rate: 1
        }
      }
      return {
        ...currencies[`${sourceCurrency.code}-${req.company.currency}`],
        ...sourceCurrency
      }
    })
    res.status(200).send({
      currencies: options
    })
  } catch (e) {
    res.status(200).send({
      currencies: [
        {
          code: req.company.currency,
          rate: 1
        }
      ]
    })
  }
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
    .sort({ 'name.common': 1 })
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
          .map(country => {
            return country.callingCode.map(code => {
              return {
                value: code,
                label: country.name.common + ' +' + code
              }
            })
          })
          .map(country => country[0])
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
          label: program.name,
          iata: program.iata
        }))
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
