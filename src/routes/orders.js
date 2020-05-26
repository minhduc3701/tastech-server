const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const Company = require('../models/company')
const Trip = require('../models/trip')
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
const { findAirlinesAirports } = require('../modules/utils')
const Xendit = require('xendit-node')
const XenditInvoice = require('../models/invoice')
const { Payout, Card } = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
})
const payout = new Payout({})
const card = new Card({})

const findAndValidateOrder = async (req, res, next) => {
  try {
    let id = req.body.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    let order

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

    req.order = order
  } catch (e) {}

  next()
}

const cancelOrderCard = async (req, res, next) => {
  try {
    let order = req.order
    if (_.get(order, 'chargeInfo.source.object', '') !== 'card') {
      return next()
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
              refundAmount = roundingAmountStripe(refundAmount, order.currency)
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
  next()
}

const cancelOrderDeposit = async (req, res, next) => {
  try {
    let order = req.order
    if (_.get(order, 'chargeInfo.paymentType', '') !== 'deposit') {
      return next()
    }
    let currencyRate = order.totalPrice / order.rawTotalPrice

    switch (order.type) {
      case 'hotel':
        switch (order[order.type].supplier) {
          case 'hotelbeds':
            let cancelHotelbedsRes = await apiHotelbeds.cancelHotelbedsOrder(
              order.customerCode
            )
            let cancellationAmount =
              cancelHotelbedsRes.data.booking.hotel.cancellationAmount
            let refundAmount =
              (order.rawTotalPrice - cancellationAmount) * currencyRate

            // refund to company
            if (refundAmount > 0) {
              let note = 'refund for orders:' + _.get(order, '_id', '')
              let company = await Company.findById(order._company)

              let {
                deposit,
                isCreditLimitation,
                creditLimitationAmount,
                remainingCredit
              } = company

              let newDeposit = company.deposit
              let newRemainingCredit = company.remainingCredit
              remainingCredit = isCreditLimitation ? remainingCredit : 0
              let newLogs = []

              if (!isCreditLimitation) {
                newDeposit += refundAmount
              } else {
                if (
                  creditLimitationAmount - company.remainingCredit >=
                  refundAmount
                ) {
                  newRemainingCredit += refundAmount
                } else {
                  newRemainingCredit = creditLimitationAmount
                  newDeposit +=
                    refundAmount - (creditLimitationAmount - remainingCredit)
                }

                if (newRemainingCredit !== remainingCredit) {
                  newLogs.push({
                    _creator: req.user._id,
                    createdAt: new Date(),
                    field: 'remainingCredit',
                    old: remainingCredit,
                    new: newRemainingCredit,
                    note
                  })
                }
              }

              if (newDeposit !== deposit) {
                newLogs.push({
                  _creator: req.user._id,
                  createdAt: new Date(),
                  field: 'deposit',
                  old: deposit,
                  new: newDeposit,
                  note
                })
              }

              let updatedData = {
                deposit: newDeposit,
                remainingCredit: newRemainingCredit
              }

              await Company.findOneAndUpdate(
                {
                  _id: company._id,
                  _partner: req.user._partner
                },
                {
                  $set: updatedData,
                  $push: { logs: newLogs }
                },
                { new: true }
              )
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
    let order = req.order
    logger.error(
      `cancel ${order.type} ${order[order.type].supplier}`,
      _.get(e, 'response.data')
    )
  }

  res.status(400).send()
  next()
}

router.post(
  '/cancel',
  findAndValidateOrder,
  cancelOrderCard,
  cancelOrderDeposit,
  emailGiamsoCancelFlight,
  emailCustomerCancelledOrder
)

router.get('/', async (req, res, next) => {
  try {
    let perPage = _.get(req.query, 'perPage', 15)
    perPage = Math.max(0, parseInt(perPage))
    let page = _.get(req.query, 'page', 0)
    page = Math.max(0, parseInt(page))

    let sortBy = _.get(req.query, 'sortBy', '')
    let sort = _.get(req.query, 'sort', 'desc')
    sort = sort === 'desc' ? -1 : 1

    let keyword = _.get(req.query, 's', '')
      .trim()
      .toLowerCase()

    let status = (
      req.query.status ||
      'unpaid,pending,processing,completed,failed,cancelling,cancelled'
    ).split(',')

    let types = (req.query.type || 'hotel,flight').split(',')

    let objFind = {
      _customer: req.user._id,
      status: { $in: status },
      type: { $in: types }
    }
    if (keyword) {
      const trips = await Trip.find({
        _company: req.user._company,
        _creator: req.user._id,
        businessTrip: true,
        archived: false,
        name: {
          $regex: new RegExp(keyword),
          $options: 'i'
        }
      })

      objFind._trip = {
        $in: trips.map(v => v._id)
      }
    }

    let objSort = {}
    if (sortBy) {
      objSort[sortBy] = sort
    } else {
      objSort = { createdAt: -1 }
    }

    let [orders, total] = await Promise.all([
      Order.find(objFind)
        // .populate('_trip', ['type', 'name', 'contactInfo'])
        // .populate('_customer', ['email'])
        .sort(objSort)
        .limit(perPage)
        .skip(perPage * page),
      Order.countDocuments(objFind)
    ])

    const [arrAirline, arrAirport] = await findAirlinesAirports(
      orders.map(order => order.flight)
    )
    let airlines = {}
    arrAirline.forEach(airline => {
      airlines[airline._doc.iata] = airline
    })
    let airports = {}
    arrAirport.forEach(airport => {
      airports[airport._doc.airport_code] = airport
    })
    res.status(200).send({
      page,
      totalPage: Math.ceil(total / perPage),
      total,
      count: orders.length,
      perPage,
      orders,
      // status,
      airlines,
      airports
    })
  } catch (error) {
    console.log('findAndValidateOrder -> error', error)
    res.status(400).send(error)
  }
})

router.patch('/', async (req, res, next) => {
  const { id, _trip } = req.body
  if (!ObjectID.isValid(_trip)) {
    return res.status(404).send()
  }

  try {
    let order = await Order.findOneAndUpdate(
      {
        _id: id,
        _customer: req.user._id
      },
      { $set: { _trip } }
    )
    res.status(200).send({ order })
  } catch (error) {
    return res.status(400).send(error)
  }
})

module.exports = router
