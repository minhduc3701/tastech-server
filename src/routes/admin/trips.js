const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeChangeTripStatus } = require('../../middleware/email')

router.get('/', (req, res) => {
  Trip.find({
    _company: req.user._company,
    businessTrip: true,
    status: { $in: ['waiting', 'approved', 'rejected'] }
  })
    .populate({
      path: '_creator',
      populate: {
        path: '_department',
        select: 'name'
      }
    })
    .sort({ updatedAt: -1 })
    .then(trips => {
      trips = trips.filter(trip => trip._creator)
      res.status(200).send({ trips })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Trip.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('_creator')
    .populate('_trip')
    .then(trip => {
      if (!trip) {
        return res.status(404).send()
      }

      res.status(200).send({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch(
  '/:id',
  (req, res, next) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    const body = _.pick(req.body, [
      'status',
      'budgetPassengers',
      'adminMessage',
      'updatedByAdmin',
      'updatedByAdminAt'
    ])
    Trip.findOneAndUpdate(
      {
        _id: id,
        _company: req.user._company
      },
      { $set: body },
      { new: true }
    )
      .then(trip => {
        req.trip = trip
        if (!trip) {
          return res.status(404).send()
        }
        res.status(200).send({ trip })
        next()
      })
      .catch(e => {
        res.status(400).send()
      })
  },
  emailEmployeeChangeTripStatus
)

module.exports = router
