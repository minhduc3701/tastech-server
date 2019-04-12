const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const { ObjectID } = require('mongodb')

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

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Trip.findOne({
    _creator: req.user._id,
    _id: req.params.id
  })
    .then(trip => {
      res.status(200).json({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res, next) {
  const trip = new Trip(req.body)
  trip._creator = req.user._id
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
