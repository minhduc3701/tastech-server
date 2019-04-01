var express = require('express')
var router = express.Router()
var Trip = require('../models/trip')
router.get('/', function(req, res, next) {
  Trip.find({
    _creator: req.user._id
  })
    .then(trips => {
      res.send({ trips })
    })
    .catch(e => {
      res.send({ error: 'Not Found' })
    })
})
router.post('/', function(req, res, next) {
  const trip = new Trip(req.body)
  trip
    .save()
    .then(() => {
      res.status(200).json({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
