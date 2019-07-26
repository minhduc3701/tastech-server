const express = require('express')
const router = express.Router()
const City = require('../models/city')
const Airport = require('../models/airport')
const IataCity = require('../models/iataCity')

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
    { $limit: 30 },
    {
      $project: {
        name: 1,
        coordinates: 1
      }
    }
  ])
    .then(cities => {
      let cityIds = []
      cities.map(city => {
        cityIds.push(city._id)
      })
      return Promise.all([
        Airport.find({
          city_name_geo_name_id: { $in: cityIds }
        }),
        IataCity.find({
          city_id: { $in: cityIds }
        }),
        cities
      ])
    })
    .then(results => {
      let airports = results[0]
      let iataCities = results[1]
      let cities = results[2]
      res.status(200).send({ cities, airports, iataCities })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
