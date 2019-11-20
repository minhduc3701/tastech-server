const _ = require('lodash')
const { getDistanceFromLatLonInKm } = require('./utils')

const suggestFlights = (flights, trip, user) => {
  let limitFlight = _.get(trip, 'flightLimitation', 0)
  let minFlight = _.minBy(flights, 'totalPrice')

  flights = flights.map(flight => {
    let point = 0

    // under budget
    if (flight.totalPrice <= limitFlight) {
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

const suggestHotelRooms = (hotels, request, user) => {
  let limitHotel = _.get(request, 'trip.hotelLimitation', 0)
  let targetLat = _.get(request, 'roomRequest.geolocation.latitude', 0)
  let targetLng = _.get(request, 'roomRequest.geolocation.longitude', 0)
  let minHotel = _.minBy(hotels, 'lowestPrice')

  hotels = hotels.map(hotel => {
    let point = 0
    let distanceToHotelInMeter =
      getDistanceFromLatLonInKm(
        targetLat,
        targetLng,
        hotel.latitude,
        hotel.longitude
      ) * 1000

    // under budget
    if (hotel.lowestPrice <= limitHotel) {
      point += 5
    }

    // prefer hotel class
    if (hotel.starRating === user.preferenceHotel.prefHotelClass) {
      point += 5
    }

    // price
    if (hotel.lowestPrice === minHotel.lowestPrice) {
      point += 4
    }

    // distance from search coordinate to hotel coordinate < 150 m
    if (distanceToHotelInMeter <= 150) {
      point += 5
    }

    // if in favorite hotels
    if (
      _.get(user, 'favoriteHotels', []).some(
        favoriteHotel => Number(favoriteHotel.hotelId) === hotel.hotelId
      )
    ) {
      point += 5
    }

    // if match hotel name
    if (
      _.toLower(hotel.name)
        .split(' ')
        .every(hotelName =>
          _.includes(_.toLower(request.locationName), hotelName)
        )
    ) {
      point += 10
    }

    return {
      ...hotel,
      point
    }
  })

  let bestHotels = _.reverse(_.sortBy(hotels, hotel => hotel.point))
  let threeBestHotels = _.slice(bestHotels, 0, 3)
  let bestHotelRooms = threeBestHotels.map(hotel => {
    let minRoom = _.minBy(
      _.get(hotel, 'ratePlans.ratePlanList', []),
      'totalPrice'
    )
    let bedTypeList = _.get(hotel, 'ratePlans.bedTypeList', [])
    let beds = bedTypeList.filter(bedType =>
      _.get(minRoom, 'bedTypeIdList', []).includes(bedType.id)
    )
    let checkInDate = _.get(
      request,
      'roomRequest.stay.checkIn',
      _.get(request, 'request.checkInDate')
    )
    let checkOutDate = _.get(
      request,
      'roomRequest.stay.checkOut',
      _.get(request, 'request.checkOutDate')
    )
    let numberOfAdult = _.get(
      request,
      'roomRequest.occupancies[0].adults',
      _.get(request, 'request.numberOfAdult')
    )
    let numberOfRoom = _.get(
      request,
      'roomRequest.occupancies[0].rooms',
      _.get(request, 'request.numberOfRoom')
    )
    return {
      ...hotel,
      ...minRoom,
      checkInDate,
      checkOutDate,
      numberOfAdult,
      numberOfRoom,
      selectedBedTypeId: _.get(beds, '[0].id', ''),
      selectedBedTypeName: _.get(beds, '[0].name', '')
    }
  })

  return {
    hotels: bestHotels,
    bestHotelRooms
  }
}

module.exports = {
  suggestFlights,
  suggestHotelRooms
}
