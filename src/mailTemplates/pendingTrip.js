const { renderMail } = require('../config/mail')
const moment = require('moment')
const _ = require('lodash')
const { formatLocaleMoney } = require('../modules/utils')

async function pendingTrip(origin, managers, trip, employee) {
  let flight = _.get(trip, 'budgetPassengers[0].flight', {})
  let lodging = _.get(trip, 'budgetPassengers[0].lodging', {})
  let transportation = _.get(trip, 'budgetPassengers[0].transportation', {})
  let meal = _.get(trip, 'budgetPassengers[0].meal', {})
  let others = _.get(trip, 'budgetPassengers[0].others', {})

  let html = await renderMail('trip-pending', {
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
    other: formatLocaleMoney(others.amount, trip.currency),
    note: others.reason,
    budget: formatLocaleMoney(
      _.get(trip, 'budgetPassengers[0].totalPrice', 0),
      trip.currency
    ),
    reviewLink: `${origin}/admin/trips/${trip._id}`
  })

  return {
    to: managers[0].email,
    cc: managers.map(e => e.email).splice(1),
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please review your colleagues's trip request`,
    html
  }
}
module.exports = {
  pendingTrip
}
