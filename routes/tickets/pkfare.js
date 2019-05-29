const express = require('express')
const router = express.Router()
const Ticket = require('../../models/ticket')
const Order = require('../../models/order')
const bodyParser = require('body-parser')
const _ = require('lodash')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
// @see https://stackoverflow.com/a/30099608
router.post('/', bodyParser.text({ type: '*/*' }), (req, res) => {
  let body

  try {
    if (_.isObject(req.body)) {
      body = req.body
    } else {
      body = JSON.parse(req.body)
    }
  } catch (e) {
    return res.status(400).send({
      errorCode: 1,
      errorMsg: 'Failure. Wrong format.'
    })
  }

  let { orderNum, permitVoid, airPnr } = body
  let ticket = new Ticket(body)

  Order.findOne({
    number: String(orderNum),
    status: { $eq: 'processing' }
  })
    .then(order => {
      if (!order) {
        throw new Error()
      }

      order.status = 'completed'
      order.pnr = airPnr
      order.canCancel = permitVoid

      return order.save()
    })
    .then(order => {
      return ticket.save()
    })
    .then(() => {
      res.status(200).send({
        errorCode: 0,
        errorMsg: 'ok'
      })
    })
    .catch(e => {
      res.status(400).send({
        errorCode: 1,
        errorMsg: 'Failure'
      })
    })
})

router.post('/voidResult', bodyParser.text({ type: '*/*' }), (req, res) => {
  let body

  try {
    if (_.isObject(req.body)) {
      body = req.body
    } else {
      body = JSON.parse(req.body)
    }
  } catch (e) {
    return res.status(400).send({
      errorCode: 1,
      errorMsg: 'Failure. Wrong format.'
    })
  }

  let { orderNum, voidOrderNum, voidResult, remark } = body
  let voidSuccess = false

  if (voidResult && voidResult.currency) {
    voidSuccess = true
  }

  Order.findOne({
    number: String(orderNum),
    cancelNumber: String(voidOrderNum),
    status: { $eq: 'cancelling' }
  })
    .then(order => {
      if (!order) {
        throw new Error()
      }

      if (voidSuccess) {
        order.status = 'cancelled'
        order.rejectedReason = null
      } else {
        order.status = 'completed'
        order.rejectedReason = remark
      }

      order.canCancel = false

      return order.save()
    })
    .then(order => {
      res.status(200).send({
        errorCode: 0,
        errorMsg: 'ok'
      })
    })
    .catch(e => {
      res.status(400).send({
        errorCode: 1,
        errorMsg: 'Failure'
      })
    })
})

module.exports = router
