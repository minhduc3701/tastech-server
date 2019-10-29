const express = require('express')
const router = express.Router()
const Airline = require('../models/airline')
const _ = require('lodash')

router.get('/search', function(req, res, next) {
  let keyword = _.trim(_.toLower(req.query.keyword))

  Airline.find({
    iata: {
      $nin: ['', '-', 'IATA'] // exclude dummy data
    },
    $or: [
      {
        name: {
          $regex: new RegExp(keyword),
          $options: 'i'
        }
      },
      {
        iata: {
          $regex: new RegExp(keyword),
          $options: 'i'
        }
      },
      {
        icao: {
          $regex: new RegExp(keyword),
          $options: 'i'
        }
      }
    ]
  })
    .limit(10)
    .then(airlines => {
      res.status(200).send({ airlines })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
