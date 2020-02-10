const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

// get all booking request
router.get('/', function(req, res, next) {
  let objFind = {
    _partner: req.user._partner,
    isBookedByPartner: true
  }

  Trip.find(objFind)
    .populate('_creator')
    .populate('_company')
    .then(trips => {
      let requests = []
      trips.map(trip => {
        _.get(trip, 'requestBookOnBehalfs', []).map(r => {
          if (r.status === 'waiting') {
            requests.push({
              ...r,
              _creator: trip._creator,
              _company: {
                _id: trip._company._id,
                name: trip._company.name
              },
              _trip: {
                _id: trip._id,
                name: trip.name
              }
            })
          }
        })
      })
      res.status(200).send({
        requests
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

// get booking request by tripId and type
router.get('/:id/:type', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let objFind = {
    _id: req.params.id,
    _partner: req.user._partner,
    isBookedByPartner: true,
    status: { $in: ['ongoing', 'approved'] }
  }
  Trip.findOne(objFind)
    .populate('_creator')
    .populate('_company')
    .then(trip => {
      let request = _.get(trip, 'requestBookOnBehalfs', []).find(
        r => r.type === req.params.type
      )
      if (_.isEmpty(request)) {
        return res.status(404).send()
      }
      request = {
        ...request,
        _id: `${trip._id}-${request.type}`,
        _creator: trip._creator,
        _company: {
          _id: trip._company._id,
          name: trip._company.name
        },
        _trip: trip
      }
      res.status(200).send({
        request
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

module.exports = router
