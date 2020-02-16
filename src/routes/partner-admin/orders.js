const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeItinerary } = require('../../middleware/email')
const {
  refundCancelledOrderManually,
  refundCancelledOrderDepositManually,
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
      .populate('_customer', ['email', 'firstName', 'lastName', 'avatar'])
      .populate('_company')
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

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Order.findOne({
    _id: req.params.id,
    _partner: req.user._partner
  })
    .populate('_customer', ['email', 'firstName', 'lastName', 'avatar'])
    .populate('_bookedBy', ['email'])
    .populate('_trip')
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

    let updatedProperties = ['status', 'pnr', 'message']
    const body = _.pick(req.body, updatedProperties)

    try {
      let oldOrder = await Order.findOne({
        _id: id,
        _partner: req.user._partner,
        status: { $ne: 'cancelled' } // don't update cancelled order
      })

      let newLogs = {
        _creator: req.user._id,
        createdAt: new Date(),
        changedValues: [],
        note: body.message || 'update order'
      }
      for (let index = 0; index < updatedProperties.length; index++) {
        if (
          _.get(oldOrder, updatedProperties[index]) !==
          _.get(body, updatedProperties[index])
        ) {
          newLogs.changedValues.push({
            field: updatedProperties[index],
            old: _.get(oldOrder, updatedProperties[index]),
            new: _.get(body, updatedProperties[index])
          })
        }
      }
      if (body.status === 'cancelled') {
        newLogs.changedValues.push({
          field: 'cancelCharge',
          old: _.get(oldOrder, 'cancelCharge'),
          new: req.body.cancelCharge
        })
      }

      let order = await Order.findOneAndUpdate(
        {
          _id: id,
          _partner: req.user._partner,
          status: { $ne: 'cancelled' } // don't update cancelled order
        },
        {
          $set: body,
          $push: { logs: newLogs }
        },
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
  refundCancelledOrderDepositManually,
  emailCustomerCancelledOrder,
  emailEmployeeItinerary
)

router.get('/:id/logs', (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  console.log(1)
  const perPage = Number(_.get(req, 'query.perPage', 10))
  const page = Number(_.get(req, 'query.page', 0))
  try {
    Promise.all([
      User.find({
        email: new RegExp(_.get(req, 'query.s', ''), 'i')
      })
    ])
      .then(results => {
        const userIds = results[0].map(user => user._id)
        return Promise.all([
          Order.aggregate([
            {
              $match: {
                _id: new ObjectID(req.params.id),
                _partner: req.user._partner
              }
            },
            { $unwind: '$logs' },
            {
              $group: {
                _id: '$logs._id',
                _creator: { $first: '$logs._creator' },
                createdAt: { $first: '$logs.createdAt' },
                // field: { $first: '$logs.field' },
                // old: { $first: '$logs.old' },
                // new: { $first: '$logs.new' },
                changedValues: { $first: '$logs.changedValues' },
                note: { $first: '$logs.note' }
              }
            },
            {
              $match: {
                _creator: { $in: userIds }
              }
            },
            {
              $sort: { createdAt: -1 }
            },
            { $skip: perPage * page },
            { $limit: perPage }
          ]),
          Order.aggregate([
            {
              $match: {
                _id: new ObjectID(req.params.id),
                _partner: req.user._partner
              }
            },
            { $unwind: '$logs' },
            {
              $group: {
                _id: '$logs._id',
                _creator: { $first: '$logs._creator' }
              }
            },
            {
              $match: {
                _creator: { $in: userIds }
              }
            }
          ])
        ])
      })
      .then(results => {
        return Promise.all([
          User.populate(results[0], [
            {
              path: '_creator',
              select: 'email username firstName lastName avatar'
            }
          ]),
          results[1].length
        ])
      })
      .then(results => {
        let logs = results[0]
        let total = results[1]
        res.status(200).send({
          logs,
          totalPage: Math.ceil(total / perPage),
          total,
          count: logs.length,
          perPage,
          page
        })
      })
      .catch(e => {
        res.status(400).send()
      })
  } catch (error) {}
})

module.exports = router
