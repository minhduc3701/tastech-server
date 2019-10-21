const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const { ObjectID } = require('mongodb')
const axios = require('axios')
const { authentication } = require('../config/pkfare')
const _ = require('lodash')
const { removeSpaces, roundingAmountStripe } = require('../modules/utils')
const apiHotelbeds = require('../modules/apiHotelbeds')
const api = require('../modules/api')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { logger } = require('../config/winston')
const { emailGiamsoCancelFlight } = require('../middleware/email')
const { emailCustomerCancelledOrder } = require('../middleware/orders')
const moment = require('moment')

router.get('/', function(req, res, next) {
  Order.find({
    _customer: req.user._id
  })
    .sort({ createdAt: -1 })
    .then(orders => {
      res.status(200).send({ orders })
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
    _customer: req.user._id
  })
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }

      res.status(200).json({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res, next) {
  const order = new Order(req.body)
  order._customer = req.user._id
  order._company = req.user._company
  order
    .save()
    .then(() => {
      res.status(200).send({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Order.findOneAndUpdate(
    {
      _id: id,
      _customer: req.user._id
    },
    { $set: req.body },
    { new: true }
  )
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }

      res.status(200).send({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post(
  '/cancel',
  async (req, res, next) => {
    let id = req.body.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    let order

    try {
      order = await Order.findOne({
        _id: id,
        _customer: req.user._id,
        status: { $eq: 'completed' },
        canCancel: { $eq: true }
      })

      if (!order) {
        return res.status(404).send()
      }

      let startDate = Date.now()

      if (order.type === 'flight') {
        startDate = _.get(order, 'flight.departureSegments[0].strDepartureDate')
      } else if (order.type === 'hotel') {
        startDate = _.get(order, 'hotel.checkInDate')
      }

      // if start date is in the past, do not allow cancel
      if (moment(startDate).diff(Date.now()) <= 0) {
        return res.status(400).send({
          message: 'You cannot cancel this order'
        })
      }

      let currencyRate = order.totalPrice / order.rawTotalPrice

      switch (order.type) {
        case 'hotel':
          switch (order[order.type].supplier) {
            case 'pkfare':
              let cancelRes = await axios.post(
                `${process.env.PKFARE_HOTEL_URI}/cancelOrder`,
                {
                  authentication,
                  request: {
                    orderCode: order.number
                  }
                }
              )
              if (cancelRes.data.header.code === 'S00000') {
                let cancellationAmount = cancelRes.data.body.cancelCharge
                let refundAmount =
                  (order.rawTotalPrice - cancellationAmount) * currencyRate
                refundAmount = roundingAmountStripe(
                  refundAmount,
                  order.currency
                )
                if (refundAmount > 0) {
                  // capture first, run even this charge is captured or not
                  // to guarantee any refunds whole or part will be ok
                  try {
                    if (refundAmount < order.chargeInfo.amount) {
                      await stripe.charges.capture(order.chargeId)
                    }
                  } catch (e) {
                    // do nothing even error or not, just a confirm step
                  }

                  // refund
                  try {
                    await stripe.refunds.create({
                      charge: order.chargeId,
                      amount: refundAmount
                    })
                  } catch (error) {
                    return res.status(400)
                  }
                }
                order.cancelCharge = cancellationAmount * currencyRate
                order.rawCancelCharge = cancellationAmount
                order.status = 'cancelled'
                order.canCancel = false
                await order.save()
                res.status(200).send({ order, result: cancelRes.data })

                // email user cancelled order
                req.cancelledOrder = order
                // next to -> emailCustomerCancelledOrder
                return next()
              }
              break

            case 'hotelbeds':
              let cancelHotelbedsRes = await apiHotelbeds.cancelHotelbedsOrder(
                order.customerCode
              )
              let cancellationAmount =
                cancelHotelbedsRes.data.booking.hotel.cancellationAmount
              let refundAmount =
                (order.rawTotalPrice - cancellationAmount) * currencyRate
              refundAmount = roundingAmountStripe(refundAmount, order.currency)
              if (refundAmount > 0) {
                try {
                  // capture first, run even this charge is captured or not
                  // to guarantee any refunds whole or part will be ok
                  try {
                    if (refundAmount < order.chargeInfo.amount) {
                      await stripe.charges.capture(order.chargeId)
                    }
                  } catch (e) {
                    // do nothing even error or not, just a confirm step
                  }

                  // refund
                  await stripe.refunds.create({
                    charge: order.chargeId,
                    amount: refundAmount
                  })
                } catch (error) {
                  return res.status(400)
                }
              }
              order.cancelCharge = cancellationAmount * currencyRate
              order.rawCancelCharge = cancellationAmount
              order.status = 'cancelled'
              order.canCancel = false
              await order.save()
              res.status(200).send({ order, result: cancelHotelbedsRes.data })

              // email user cancelled order
              req.cancelledOrder = order
              // next to -> emailCustomerCancelledOrder
              return next()
          }
          break

        case 'flight':
          switch (order[order.type].supplier) {
            case 'pkfare':
              let voidRequest = {
                orderNum: order.number,
                passengers: order.passengers.map(passenger => ({
                  cardType: 'P',
                  cardNum: passenger.passportNo,
                  firstName: removeSpaces(passenger.firstName),
                  lastName: removeSpaces(passenger.lastName)
                }))
              }

              logger.info('voidingRQ', voidRequest)

              let cancelRes = await api.voiding(voidRequest)

              logger.info('voidingRS', cancelRes.data)

              if (cancelRes.data.errorCode === '0') {
                let voidOrderNum = cancelRes.data.data.voidOrderNum
                order.status = 'cancelling'
                order.cancelNumber = voidOrderNum
                await order.save()
                return res.status(200).send({ order, result: cancelRes.data })
              }
              break
            case 'sabre':
              // will email after this step and cancel manually
              order.status = 'cancelling'
              order.save()
              res.status(200).send({
                order,
                result: {
                  messagge: 'Waiting'
                }
              })

              // save for next middleware
              req.cancellingOrder = order
              return next()

              break
          }
          break
      }
    } catch (e) {
      logger.error(
        `cancel ${order.type} ${order[order.type].supplier}`,
        _.get(e, 'response.data')
      )
    }
    res.status(400).send()
  },
  emailGiamsoCancelFlight,
  emailCustomerCancelledOrder
)

module.exports = router
