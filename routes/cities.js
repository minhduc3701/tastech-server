const express = require('express')
const router = express.Router()
const City = require('../models/city')
const Airport = require('../models/airport')

const _ = require('lodash')

router.post('/search', function(req, res, next) {
  City.aggregate([
    {
      $match: {
        alternate_names: {
          $elemMatch: {
            $eq: _.toLower(_.trim(req.body.name))
          }
        }
      }
    },
    { $limit: 10 },
    {
      $project: {
        name: 1
      }
    }
  ])
    .then(cities => {
      let cityIds = []
      cities.map(city => {
        cityIds.push(city._id)
      })
      return Airport.find({
        city_name_geo_name_id: { $in: cityIds }
      })
    })
    .then(airports => {
      res.status(200).send(airports)
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
