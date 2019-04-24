const express = require('express')
const router = express.Router()
const City = require('../models/city')
const _ = require('lodash')

router.post('/search', function(req, res, next) {
  City.find({
    alternate_names: {
      $elemMatch: {
        $eq: _.toLower(_.trim(req.body.name))
      }
    }
  })
    .then(cities => {
      res.status(200).send({ cities })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
