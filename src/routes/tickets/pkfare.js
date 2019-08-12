const express = require('express')
const router = express.Router()
const Ticket = require('../../models/ticket')
const VoidTicket = require('../../models/voidTicket')
const Order = require('../../models/order')
const bodyParser = require('body-parser')
const _ = require('lodash')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { logger } = require('../../config/winston')
const api = require('../../modules/api')
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

  Promise.all([
    ticket.save(),
    Order.findOneAndUpdate(
      {
        number: String(orderNum),
        status: 'processing'
      },
      {
        $set: {
          status: 'completed',
          pnr: airPnr,
          canCancel: permitVoid
        }
      }
    )
  ])
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

  let voidTicket = new VoidTicket(body)

  Promise.all([
    voidTicket.save(),
    Order.findOneAndUpdate(
      {
        number: String(orderNum),
        cancelNumber: String(voidOrderNum),
        status: 'cancelling'
      },
      {
        $set: {
          status: voidSuccess ? 'cancelled' : 'completed',
          rejectedReason: voidSuccess ? null : remark,
          canCancel: false
        }
      }
    )
  ])
    .then(async result => {
      let resRate = await api.exchangeCurrency(
        result[1].rawCurrency,
        result[1].currency
      )
      let rate = resRate.data[0].rate
      await stripe.refunds.create({
        charge: result[1].chargeId,
        amount: voidTicket.voidResult.reimburseAmount * rate
      })
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
