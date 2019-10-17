const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { roundingAmountStripe } = require('../modules/utils')

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

  if (refundAmount <= 0) {
    return next()
  }

  try {
    let refund = await stripe.refunds.create({
      charge: order.chargeId,
      amount: roundingAmountStripe(refundAmount, order.currency)
    })

    order.cancelCharge = cancelCharge
    order.rawCancelCharge =
      cancelCharge / (order.totalPrice / order.rawTotalPrice)

    await order.save()
  } catch (e) {}

  next()
}

module.exports = {
  refundCancelledOrderManually
}
