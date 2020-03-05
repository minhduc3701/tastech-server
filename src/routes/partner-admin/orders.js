const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const User = require('../../models/user')
const Company = require('../../models/company')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeItinerary } = require('../../middleware/email')
const {
  refundCancelledOrderManually,
  refundCancelledOrderDepositManually,
  emailCustomerCancelledOrder
} = require('../../middleware/orders')
const { findAirlinesAirports } = require('../../modules/utils')

router.get('/', async (req, res, next) => {
  let perPage = _.get(req.query, 'perPage', 50)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let sortBy = _.get(req.query, 'sortBy', '')
  let sort = _.get(req.query, 'sort', 'desc')
  sort = sort === 'desc' ? -1 : 1

  let keyword = _.get(req.query, 's', '')
    .trim()
    .toLowerCase()
  let searchObject = {
    $regex: new RegExp(keyword),
    $options: 'i'
  }

  let objSort = {}
  if (sortBy) {
    objSort[sortBy] = sort
  } else {
    objSort = { updatedAt: -1 }
  }

  let companyIds = []
  let userIds = []
  try {
    let companies = await Company.find({ name: searchObject }).limit(5)
    companyIds = companies.map(c => c._id)
  } catch (e) {
    // do nothing if cannot find company
  }
  try {
    let users = await User.find({
      $or: [
        {
          email: searchObject
        },
        {
          firstName: searchObject
        },
        {
          lastName: searchObject
        }
      ]
    })
    userIds = users.map(u => u._id)
  } catch (e) {
    // do nothing if cannot find user
  }
  let objFind = {
    _partner: req.user._partner,
    $or: [
      {
        pnr: searchObject
      },
      {
        customerCode: searchObject
      },
      {
        _company: { $in: companyIds }
      },
      {
        _customer: { $in: userIds }
      }
    ]
  }

  Promise.all([
    Order.find(objFind)
      .populate('_trip', ['type', 'name', 'contactInfo'])
      .populate('_customer', ['email', 'firstName', 'lastName', 'avatar'])
      .populate('_company')
      .sort(objSort)
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
        orders
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

    let pickedProperties = ['status', 'pnr', 'message', 'cancelCharge']
    let updatedProperties = ['status', 'pnr']

    const body = _.pick(req.body, pickedProperties)

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
        note: body.message || 'Update'
      }
      for (let index = 0; index < updatedProperties.length; index++) {
        if (
          _.get(oldOrder, updatedProperties[index], '') !==
          _.get(body, updatedProperties[index], '')
        ) {
          newLogs.changedValues.push({
            field: updatedProperties[index],
            old: _.get(oldOrder, updatedProperties[index], ''),
            new: _.get(body, updatedProperties[index], '')
          })
        }
      }
      if (body.status === 'cancelled') {
        newLogs.changedValues.push({
          field: 'cancelCharge',
          old: _.get(oldOrder, 'cancelCharge', 0),
          new: body.cancelCharge
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

router.get('/:id/logs', async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  const perPage = Number(_.get(req, 'query.perPage', 10))
  const page = Number(_.get(req, 'query.page', 0))

  try {
    Promise.all([
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
            changedValues: { $first: '$logs.changedValues' },
            note: { $first: '$logs.note' }
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
          $match: {
            '_creator.0.email': {
              $regex: new RegExp(_.get(req, 'query.s', ''), 'i')
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        { $skip: perPage * page },
        { $limit: perPage },
        {
          $project: {
            _creator: {
              $let: {
                vars: {
                  field: {
                    $arrayElemAt: ['$_creator', 0]
                  }
                },
                in: {
                  firstName: '$$field.firstName',
                  lastName: '$$field.lastName',
                  email: '$$field.email',
                  avatar: '$$field.avatar'
                }
              }
            },
            createdAt: 1,
            changedValues: 1,
            note: 1
          }
        }
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
            _creator: { $first: '$logs._creator' },
            createdAt: { $first: '$logs.createdAt' },
            changedValues: { $first: '$logs.changedValues' },
            note: { $first: '$logs.note' }
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
          $match: {
            '_creator.0.email': {
              $regex: new RegExp(_.get(req, 'query.s', ''), 'i')
            }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ])
    ])
      .then(results => {
        let logs = results[0]
        let total = results[1][0].count
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
