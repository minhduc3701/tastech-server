const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

router.get('/:id/:type', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let objFind = {
    _id: req.params.id,
    _partner: req.user._partner,
    isBookedByPartner: true
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
        _creator: trip._creator,
        _company: {
          _id: trip._company._id,
          name: trip._company.name
        },
        _trip: _.pick(trip, ['_id', 'name', 'budgetPassengers', 'currency'])
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
