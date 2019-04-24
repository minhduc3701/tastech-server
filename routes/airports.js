const express = require('express')
const router = express.Router()
const Airport = require('../models/airport')
const _ = require('lodash')

router.post('/search', function(req, res, next) {
  let body = _.pick(req.body, ['airport_code', 'city_name_geo_name_id'])

  Airport.find(body)
    .then(airports => {
      res.status(200).send({ airports })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
