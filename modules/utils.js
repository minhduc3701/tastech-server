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
      gender: passenger.title === 'Mr' ? 2 : 1,
      firstName: _.replace(passenger.firstName, /\s/g, ''),
      lastName: _.replace(passenger.lastName, /\s/g, '')
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

module.exports = {
  makeSegmentsData,
  makeRoomGuestDetails
}
