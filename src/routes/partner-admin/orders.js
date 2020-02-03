const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const Trip = require('../../models/trip')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeItinerary } = require('../../middleware/email')
const {
  refundCancelledOrderManually,
  emailCustomerCancelledOrder
} = require('../../middleware/orders')
const { findAirlinesAirports } = require('../../modules/utils')

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 50)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let status = _.get(req.query, 'status', '')
  let companies = _.get(req.query, 'companies', '')

  let objFind = {
    _partner: req.user._partner
  }
  if (status) {
    objFind.status = status
  }
  if (!_.isEmpty(companies)) {
    companies = companies.split(',')
    objFind._company = { $in: companies }
  }

  Promise.all([
    Order.find(objFind)
      .populate('_trip', ['type', 'name', 'contactInfo'])
      .populate('_customer', ['email'])
      .sort({ createdAt: -1 })
      .limit(perPage)
      .skip(perPage * page),
    Order.countDocuments(objFind)
  ])
    .then(results => {
      let orders = results[0]
      let total = results[1]
      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: orders.length,
        perPage,
        orders,
        status
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

router.get('/booking-request', function(req, res, next) {
  // let perPage = _.get(req.query, 'perPage', 50)
  // perPage = Math.max(0, parseInt(perPage))
  // let page = _.get(req.query, 'page', 0)
  // page = Math.max(0, parseInt(page))
  // let status = _.get(req.query, 'status', '')
  // let companies = _.get(req.query, 'companies', '')

  let objFind = {
    _partner: req.user._partner,
    isBookedByPartner: true
  }
  // if (status) {
  //   objFind.status = status
  // }
  // if (!_.isEmpty(companies)) {
  //   companies = companies.split(',')
  //   objFind._company = { $in: companies }
  // }

  Trip.find(objFind)
    .populate('_creator')
    .populate('_company')
    .then(trips => {
      let requests = []
      trips.map(trip => {
        _.get(trip, 'requestBookOnBehalfs', []).map(r => {
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

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Order.findOne({
    _id: req.params.id,
    _partner: req.user._partner
  })
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }
      return Promise.all([
        order,
        findAirlinesAirports([_.get(order, 'flight', {})])
      ])
    })
    .then(results => {
      let order = results[0]
      let arrAirline = results[1][0]
      let arrAirport = results[1][1]
      let airlines = {}
      arrAirline.forEach(airline => {
        airlines[airline._doc.iata] = airline
      })
      let airports = {}
      arrAirport.forEach(airport => {
        airports[airport._doc.airport_code] = airport
      })

      res.status(200).send({
        order,
        airlines,
        airports
      })
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})

router.patch(
  '/:id',
  async (req, res, next) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    const body = _.pick(req.body, ['status', 'pnr'])

    try {
      let order = await Order.findOneAndUpdate(
        {
          _id: id,
          _partner: req.user._partner,
          status: { $ne: 'cancelled' } // don't update cancelled order
        },
        { $set: body },
        { new: true }
      )

      if (!order) {
        return res.status(404).send()
      }

      res.status(200).send({ order })

      if (order.status === 'completed') {
        //for sending email to employee
        req.trip = {
          _id: order._trip
        }
        return next()
      }

      // refund order manually
      if (order.status === 'cancelled') {
        req.cancelledOrder = order
        req.cancelCharge = req.body.cancelCharge
        return next()
      }
    } catch (e) {
      res.status(400).send()
    }
  },
  refundCancelledOrderManually,
  emailCustomerCancelledOrder,
  emailEmployeeItinerary
)

module.exports = router
