const express = require('express')
const router = express.Router()
const Country = require('../models/country')

router.get('/', function(req, res, next) {
  Country.find({})
    .then(countries => {
      res.status(200).send({ countries })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
