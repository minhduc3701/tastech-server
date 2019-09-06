const { renderMail } = require('../config/mail')
const moment = require('moment')

async function pendingTrip(managers, trip, employee) {
  let {
    flight,
    lodging,
    transportation,
    meal,
    others
  } = trip.budgetPassengers[0]

  let html = await renderMail('trip-pendding', {
    title: '',
    employeeName: employee.firstName,
    tripName: trip.name,
    startDate: moment(trip.startDate).format('ll'),
    endDate: moment(trip.endDate).format('ll'),
    isFlightSelected: flight.selected,
    flight: `${flight.departDestination} (${flight.departDestinationCode}) - ${
      flight.returnDestination
    } (${flight.returnDestinationCode})`,
    departDate: moment(flight.departDate).format('ll'),
    isRoundTrip: flight.flightType === 'round-trip',
    returnDate: moment(flight.returnDate).format('ll'),
    isLodgingSelected: lodging.selected,
    regionName: lodging.regionName,
    checkInDate: moment(lodging.checkInDate).format('ll'),
    checkOutDate: moment(lodging.checkOutDate).format('ll'),
    isTransportationSelected: transportation.selected,
    daysOfTrip: trip.daysOfTrip,
    isMealSelected: meal.selected,
    isOthersSelected: others.selected,
    other: `${Math.round(others.amount).toLocaleString()} ${trip.currency}`,
    note: others.reason,
    budget: `${Math.round(
      trip.budgetPassengers[0].totalPrice
    ).toLocaleString()} ${trip.currency}`,
    reviewLink: `${process.env.APP_URI}`
  })

  return {
    to: managers[0].email,
    cc: managers.map(e => e.email).splice(1),
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please review your colleagues's trip request`,
    html
  }
}
module.exports = {
  pendingTrip
}
