const _ = require('lodash')

const makeSegmentsData = segment => {
  let data = _.pick(segment, [
    'airline',
    'arrival',
    'bookingCode',
    'departure',
    'flightNum'
  ])

  return {
    ...data,
    arrivalDate: segment.strArrivalDate,
    arrivalTime: segment.strArrivalTime,
    departureDate: segment.strDepartureDate,
    departureTime: segment.strDepartureTime
  }
}

const makeRoomGuestDetails = (passengers, numberOfRoom) => {
  let roomGuestDetails = []
  let countAdult = 0
  let pi = 0
  let ri = 0

  do {
    let passenger = passengers[pi]
    let passengerInfo = {
      gender: passenger.title === 'mr' ? 2 : 1,
      firstName: removeSpaces(passenger.firstName),
      lastName: removeSpaces(passenger.lastName)
    }

    if (!roomGuestDetails[ri]) {
      roomGuestDetails[ri] = {
        guestInfos: [passengerInfo]
      }
    } else {
      roomGuestDetails[ri].guestInfos.push(passengerInfo)
    }

    countAdult++
    pi++
    ri++

    if (ri === numberOfRoom) {
      ri = 0
    }
  } while (countAdult < passengers.length)

  return roomGuestDetails
}

const removeSpaces = str => _.replace(str, /\s+/g, '')

const makeFlightsData = (data, { isRoundTrip, currency, numberOfAdults }) => {
  let flightsData = []
  if (data) {
    data.solutions.forEach(solution => {
      let departureFlights = data.flights.filter(
        flight =>
          solution.journeys.journey_0.findIndex(
            flightId => flightId === flight.flightId
          ) >= 0
      )
      let departureFlight = departureFlights[0]

      let departureSegments = []
      let departureSegmentIds = departureFlight.segmengtIds
      departureSegmentIds.forEach(id => {
        let segmentIndex = data.segments.findIndex(
          segment => segment.segmentId === id
        )
        let segment = data.segments[segmentIndex]
        departureSegments.push(segment)
      })

      let returnFlight = {}
      let returnSegments = []
      if (isRoundTrip) {
        // return flight
        let returnFlights = data.flights.filter(
          flight =>
            solution.journeys.journey_1.findIndex(
              flightId => flightId === flight.flightId
            ) >= 0
        )
        returnFlight = returnFlights[0]

        let returnSegmentIds = returnFlight.segmengtIds
        returnSegmentIds.forEach(id => {
          let segmentIndex = data.segments.findIndex(
            segment => segment.segmentId === id
          )
          let segment = data.segments[segmentIndex]
          returnSegments.push(segment)
        })
      }

      let adultPriceBreakdown = ['adtFare', 'adtTax', 'tktFee']

      let serviceFeeBreadkdown = ['platformServiceFee', 'merchantFee']

      let adultPrice = adultPriceBreakdown.reduce(
        (acc, fee) => solution[fee] + acc,
        0
      )
      let serviceFee = serviceFeeBreadkdown.reduce(
        (acc, fee) => solution[fee] + acc,
        0
      )

      let price = (adultPrice + serviceFee) * currency.rate
      let rawTotalPrice = adultPrice * numberOfAdults + serviceFee
      let totalPrice = rawTotalPrice * currency.rate

      flightsData.push({
        ...solution,
        currency: currency.code,
        price,
        totalPrice,
        rawTotalPrice,
        departureFlight,
        departureSegments,
        returnFlight,
        returnSegments,
        supplier: 'pkfare'
      })
    })
  }
  flightsData = _.sortBy(flightsData, ['price'])
  return flightsData
}

module.exports = {
  makeSegmentsData,
  makeRoomGuestDetails,
  removeSpaces,
  makeFlightsData
}
