const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function orderCancelled(order, refundAmount) {
  let html = ''

  try {
    html = await renderMail('order-cancelled', {
      name: `${order._customer.firstName}`,
      order,
      refundAmount:
        refundAmount > 0 ? formatLocaleMoney(refundAmount, order.currency) : 0,
      isFlightOrder: order.type === 'flight',
      flight: order.flight,
      isHotelOrder: order.type === 'hotel',
      hotel: order.hotel,
      orderLink: `${process.env.APP_URI}/employee/travel/${
        order._trip
      }?tab=itinerary`
    })
  } catch (e) {
    console.log(e)
  }

  return {
    to: order._customer.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your order has been cancelled`,
    html
  }
}

module.exports = {
  orderCancelled
}
