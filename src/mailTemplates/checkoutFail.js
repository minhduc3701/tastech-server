const _ = require('lodash')
const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function checkoutFail(req) {
  let { trip, flightOrder, hotelOrder } = req
  let amountFail = 0
  let currency = ''
  let chargedFailedFlight =
    trip.flight &&
    flightOrder &&
    flightOrder.status === 'failed' &&
    flightOrder.chargeId
  let chargedFailedHotel =
    trip.hotel &&
    hotelOrder &&
    hotelOrder.status === 'failed' &&
    hotelOrder.chargeId

  if (chargedFailedFlight) {
    let flight = flightOrder.flight
    amountFail += flightOrder.totalPrice
    currency = flight.currency
  }

  if (chargedFailedHotel) {
    let hotel = hotelOrder.hotel
    amountFail += hotelOrder.totalPrice
    currency = hotelOrder.hotel.currency
  }

  amountFail = formatLocaleMoney(amountFail, currency)

  let html = await renderMail('checkout-fail', {
    chargedFailedFlight,
    chargedFailedHotel,
    flight: _.get(flightOrder, 'flight'),
    hotel: _.get(hotelOrder, 'hotel'),
    user: req.user,
    amountFail,
    appLink: `${process.env.APP_URI}/employee/travel/${trip._id}?tab=itinerary`
  })

  return {
    to: req.user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your reservation to EzBizTrip could not complete`,
    html
  }
}

module.exports = {
  checkoutFail
}
