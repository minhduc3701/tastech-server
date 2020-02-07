const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { roundingAmountStripe } = require('../modules/utils')
const { orderCancelled } = require('../mailTemplates/orderCancelled')
const Order = require('../models/order')
const Company = require('../models/company')
const { mail } = require('../config/mail')
const _ = require('lodash')

// Run after PATCH /tas-admin/orders/:id
const refundCancelledOrderManually = async (req, res, next) => {
  if (
    !req.cancelledOrder ||
    _.get(req, 'cancelledOrder.chargeInfo.source.object', '') !== 'card'
  ) {
    return next()
  }

  let order = req.cancelledOrder
  let cancelCharge = Math.max(req.cancelCharge, 0)
  let refundAmount = 0

  if (cancelCharge > order.totalPrice) {
    cancelCharge = order.totalPrice
  }

  refundAmount = order.totalPrice - cancelCharge
  refundAmount = roundingAmountStripe(refundAmount, order.currency)

  // capture first, run even this charge is captured or not
  // to guarantee any refunds whole or part will be ok
  try {
    if (refundAmount < order.chargeInfo.amount) {
      await stripe.charges.capture(order.chargeId)
    }
  } catch (e) {
    // do nothing even error or not, just a confirm step
  }

  try {
    if (refundAmount > 0) {
      await stripe.refunds.create({
        charge: order.chargeId,
        amount: refundAmount
      })
    }

    order.cancelCharge = cancelCharge
    order.rawCancelCharge =
      cancelCharge / (order.totalPrice / order.rawTotalPrice)

    await order.save()
  } catch (e) {}

  next()
}

const refundCancelledOrderDepositManually = async (req, res, next) => {
  if (
    !req.cancelledOrder ||
    _.get(req, 'cancelledOrder.chargeInfo.paymentType', '') !== 'deposit'
  ) {
    return next()
  }

  let order = req.cancelledOrder
  let cancelCharge = Math.max(req.cancelCharge, 0)
  let refundAmount = 0

  if (cancelCharge > order.totalPrice) {
    cancelCharge = order.totalPrice
  }

  refundAmount = order.totalPrice - cancelCharge

  try {
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
        if (creditLimitationAmount - company.remainingCredit >= refundAmount) {
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

    order.cancelCharge = cancelCharge
    order.rawCancelCharge =
      cancelCharge / (order.totalPrice / order.rawTotalPrice)

    await order.save()
  } catch (e) {}

  next()
}

// required
//   req.cancelledOrder
const emailCustomerCancelledOrder = async (req, res, next) => {
  if (!req.cancelledOrder) {
    return next()
  }

  let order = await Order.populate(req.cancelledOrder, { path: '_customer' })
  let refundAmount = order.totalPrice - order.cancelCharge

  let mailOptions = await orderCancelled(
    req.headers.origin,
    order,
    refundAmount
  )
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      // debugMail(err)
      // logger.error('mail: ', { err: err })
    }
  })
}

module.exports = {
  refundCancelledOrderManually,
  refundCancelledOrderDepositManually,
  emailCustomerCancelledOrder
}
