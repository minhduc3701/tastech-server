const _ = require('lodash')
const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function checkoutFail(req) {
  let { trip, flightOrder, hotelOrder } = req
  let amountFail = 0
  let currency = ''
  let hadFailedFlight =
    trip.flight && flightOrder && flightOrder.status === 'failed'
  let hadFailedHotel =
    trip.hotel && hotelOrder && hotelOrder.status === 'failed'

  if (hadFailedFlight) {
    let flight = flightOrder.flight
    amountFail += flightOrder.totalPrice
    currency = flight.currency
  }

  if (hadFailedHotel) {
    let hotel = hotelOrder.hotel
    amountFail += hotelOrder.totalPrice
    currency = hotelOrder.hotel.currency
  }

  amountFail = formatLocaleMoney(amountFail, currency)

  let html = await renderMail('checkout-fail', {
    hadFailedFlight,
    hadFailedHotel,
    flight: _.get(flightOrder, 'flight'),
    hotel: _.get(hotelOrder, 'hotel')
  })

  return {
    to: req.user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `${amountFail} ${currency} payment to EzBizTrip was unsuccessful`,
    html
  }
}

module.exports = {
  checkoutFail
}
