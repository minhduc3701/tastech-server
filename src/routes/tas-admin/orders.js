const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeItinerary } = require('../../middleware/email')
const {
  refundCancelledOrderManually,
  emailCustomerCancelledOrder
} = require('../../middleware/orders')

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 50)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let status = _.get(req.query, 'status', '')
  let objFind = {}
  if (status) {
    objFind.status = status
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

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Order.findOne({
    _id: req.params.id
  })
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }
      // restrict order chargeInfo props responsed
      let orderData = order.toObject()
      orderData.chargeInfo = _.pick(orderData.chargeInfo, 'amount')
      res.status(200).send({ order: orderData })
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

    const body = _.pick(req.body, ['status', 'pnr'])

    try {
      let order = await Order.findOneAndUpdate(
        {
          _id: id,
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
