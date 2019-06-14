const express = require('express')
const router = express.Router()
const Region = require('../models/region')
const _ = require('lodash')

router.post('/search', (req, res) => {
  let region = _.trim(req.body.name)

  Region.find({
    name: new RegExp(region, 'i')
  })
    .limit(10)
    .then(regions => res.status(200).send({ regions }))
    .catch(e => res.status(400).send())
})

module.exports = router
