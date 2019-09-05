const _ = require('lodash')
function checkoutFail(req) {
  let html = `<style>div { color:red; }</style>
  <div>We were unable to charge your payment for following trip payment: <br/>`
  let { trip, flightOrder, hotelOrder } = req
  let amountFail = 0
  let currency = ''

  if (trip.flight && flightOrder && flightOrder.status === 'failed') {
    let flight = flightOrder.flight
    amountFail += flightOrder.totalPrice
    currency = flight.currency
    html += `Flight: <br/>
     (${flight.departureSegments[0].departure}) -  (${
      flight.departureSegments[flight.departureSegments.length - 1].arrival
    })
     departure: ${flight.departureSegments[0].strDepartureDate}
    `
    if (!_.isEmpty(flight.returnSegments)) {
      html += `return: ${flight.returnSegments[0].strDepartureDate}`
    }
  }

  if (trip.hotel && hotelOrder && hotelOrder.status === 'failed') {
    let hotel = hotelOrder.hotel
    amountFail += hotelOrder.totalPrice
    currency = hotelOrder.hotel.currency
    html += `<br/> Hotel: <br/> 
    ${hotel.name} (${hotel.cityName}), checkin: ${
      hotel.checkInDate
    } - checkout ${hotel.checkOutDate}`
  }

  if (currency === 'VND') {
    amountFail = Math.round(amountFail)
  } else {
    amountFail = (Math.round(amountFail * 100) / 100).toFixed(2)
  }

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
