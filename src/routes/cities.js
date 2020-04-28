const express = require('express')
const router = express.Router()
const City = require('../models/city')
const Airport = require('../models/airport')
const IataCity = require('../models/iataCity')
const Country = require('../models/country')

const _ = require('lodash')

router.post('/search', function(req, res, next) {
  let regExpSearch = {
    $regex: new RegExp(_.trim(_.toString(req.body.name))),
    $options: 'i'
  }
  City.aggregate([
    {
      $match: {
        alternate_names: {
          $elemMatch: {
            $eq: _.toLower(_.trim(_.toString(req.body.name)))
          }
        }
      }
    },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        coordinates: 1,
        country: 1
      }
    }
  ])
    .then(cities => {
      let cityIds = []
      cities.map(city => {
        cityIds.push(city._id)
      })
      let countryCodes = cities.map(city => city.country)

      let airportFindArr = [
        { city_name_geo_name_id: { $in: cityIds } },
        { airport_code: regExpSearch }
      ]

      if (_.trim(_.toString(req.body.name)).length > 3) {
        // length > 3 - search by city country nam
        airportFindArr.push(
          {
            country_name: regExpSearch
          },
          {
            country_name_nl: regExpSearch
          }
        )
      }
      return Promise.all([
        Airport.find({
          $or: airportFindArr
        }).limit(30), // limit airports to 30
        IataCity.find({
          city_id: { $in: cityIds }
        }),
        cities,
        Country.find({
          cca2: { $in: countryCodes }
        })
      ])
    })
    .then(results => {
      let airports = results[0]
      let iataCities = results[1]
      let cities = results[2]
      let countries = results[3]

      cities = cities.map(city => {
        let countryItem = countries.find(
          country => country.cca2 === city.country
        )
        return {
          ...city,
          label: city.name + ', ' + _.get(countryItem, 'name.common')
        }
      })

      res.status(200).send({ cities, airports, iataCities })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
