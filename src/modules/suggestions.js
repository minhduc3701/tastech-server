const _ = require('lodash')

const suggestFlights = (flights, trip, user) => {
  let limitFlight = _.get(trip, 'flightLimitation', 0)
  let minFlight = _.minBy(flights, flight => flight.totalPrice)

  flights = flights.map(flight => {
    let point = 0

    // under budget
    if (flight.totalPrice < limitFlight) {
      point += 5
    }

    // booking history + 5 if match
    // logic goes here

    // no stop
    if (flight.departureSegments.length === 1) {
      point += 5
    }

    // cancellable/refundable
    if (flight.refundable) {
      point += 4
    }

    // prefer airline
    if (
      _.toLower(flight.departureSegments[0].airline) ===
      _.toLower(user.preferenceFlight.prefAirline)
    ) {
      point += 4
    }

    // price
    if (flight.totalPrice === minFlight.totalPrice) {
      point += 3
    }

    return {
      ...flight,
      point
    }
  })

  let sortFlights = _.reverse(_.sortBy(flights, flight => flight.point))
  let bestFlights = _.slice(sortFlights, 0, 3)

  return {
    flights,
    bestFlights
  }
}

module.exports = {
  suggestFlights
}
