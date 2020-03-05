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
  let sortBy = _.get(req.query, 'sortBy', '')
  let sort = _.get(req.query, 'sort', 'desc')
  sort = sort === 'desc' ? -1 : 1

  let keyword = _.get(req.query, 's', '').trim()

  let objFind = {
    _partner: req.user._partner,
    isBookedByPartner: true,
    requestBookOnBehalfs: { $elemMatch: { status: 'waiting' } }
  }

  Promise.all([
    Trip.aggregate([
      {
        $match: objFind
      },
      { $unwind: '$requestBookOnBehalfs' },
      {
        $match: {
          'requestBookOnBehalfs.status': 'waiting'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_creator',
          foreignField: '_id',
          as: '_creator'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_company',
          foreignField: '_id',
          as: '_company'
        }
      },
      {
        $match: {
          $or: [
            {
              '_creator.0.email': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_creator.0.firstName': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_creator.0.lastName': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_company.0.name': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              name: {
                $regex: new RegExp(keyword, 'i')
              }
            }
          ]
        }
      },
      {
        $sort: { [sortBy]: sort }
      },
      { $skip: perPage * page },
      { $limit: perPage }
    ]),
    Trip.aggregate([
      {
        $match: objFind
      },
      { $unwind: '$requestBookOnBehalfs' },
      {
        $match: {
          'requestBookOnBehalfs.status': 'waiting'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_creator',
          foreignField: '_id',
          as: '_creator'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_company',
          foreignField: '_id',
          as: '_company'
        }
      },
      {
        $match: {
          $or: [
            {
              '_creator.0.email': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_creator.0.firstName': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_creator.0.lastName': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              '_company.0.name': {
                $regex: new RegExp(keyword, 'i')
              }
            },
            {
              name: {
                $regex: new RegExp(keyword, 'i')
              }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ])
  ]).then(results => {
    let requests = []
    results[0].map(trip => {
      requests.push({
        ...trip.requestBookOnBehalfs,
        _creator: trip._creator[0],
        _company: {
          _id: trip._company[0]._id,
          name: trip._company[0].name
        },
        startDate:
          trip.requestBookOnBehalfs.type === 'flight'
            ? _.get(trip, 'budgetPassengers[0].flight.departDate')
            : _.get(trip, 'budgetPassengers[0].lodging.checkInDate'),
        routine:
          trip.requestBookOnBehalfs.type === 'flight'
            ? `${_.get(
                trip,
                'budgetPassengers[0].flight.departDestinationCode'
              )} - 
          ${_.get(trip, 'budgetPassengers[0].flight.returnDestinationCode')}`
            : `${_.get(trip, 'budgetPassengers[0].lodging.regionName')}`,

        _trip: trip
      })
    })
    let total = results[1][0].count
    res.status(200).send({
      requests,
      page,
      totalPage: Math.ceil(total / perPage),
      total,
      count: requests.length,
      perPage
    })
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
