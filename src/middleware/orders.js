const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { roundingAmountStripe } = require('../modules/utils')
const { orderCancelled } = require('../mailTemplates/orderCancelled')
const Order = require('../models/order')
const { mail } = require('../config/mail')

// Run after PATCH /tas-admin/orders/:id
const refundCancelledOrderManually = async (req, res, next) => {
  if (!req.cancelledOrder) {
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

// required
//   req.cancelledOrder
const emailCustomerCancelledOrder = async (req, res, next) => {
  if (!req.cancelledOrder) {
    return next()
  }

  let order = await Order.populate(req.cancelledOrder, { path: '_customer' })
  let refundAmount = order.totalPrice - order.cancelCharge

  let mailOptions = await orderCancelled(order, refundAmount)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      // debugMail(err)
      // logger.error('mail: ', { err: err })
    }
  })
}

module.exports = {
  refundCancelledOrderManually,
  emailCustomerCancelledOrder
}
