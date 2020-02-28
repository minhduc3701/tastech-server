const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

// get all booking request
router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 10)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))

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
              _trip: trip
            })
          }
        })
      })
      let total = requests.length
      requests = requests.slice(page * perPage, (page + 1) * perPage)
      res.status(200).send({
        requests,
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: requests.length,
        perPage
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
        _company: trip._company,
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
