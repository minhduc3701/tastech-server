const _ = require('lodash')
const { getDistanceFromLatLonInKm } = require('./utils')

const SMART_POINTS_FLIGHT = {
  BUSINESS_TRIP: {
    underBudget: 20,
    matchPolicyClass: 30,
    underPolicyLimit: 20,
    matchBooked: 30,
    nonStop: 30,
    refundable: 30,
    baggageAllowance: 10,
    matchLoyaltyProgram: 20,
    lowestPrice: 20,
    matchPreferenceFlight: 0
  },
  PERSONAL_TRIP: {
    underBudget: 0,
    matchPolicyClass: 0,
    underPolicyLimit: 0,
    matchBooked: 20,
    nonStop: 10,
    refundable: 10,
    baggageAllowance: 10,
    matchLoyaltyProgram: 10,
    lowestPrice: 20,
    matchPreferenceFlight: 10
  }
}

const SMART_POINTS_HOTEL = {
  BUSINESS_TRIP: {
    underBudget: 20,
    matchPolicyClass: 20,
    overPolicyClass: 10,
    underPolicyLimit: 20,
    matchBooked: 30,
    matchFavorite: 30,
    matchLoyaltyProgram: 15,
    lowestPrice: 10,
    matchSearchedName: 30,
    distance: 20,
    matchPrefHotelClass: 0
  },
  PERSONAL_TRIP: {
    underBudget: 0,
    matchPolicyClass: 0,
    overPolicyClass: 0,
    underPolicyLimit: 0,
    matchBooked: 15,
    matchFavorite: 10,
    matchLoyaltyProgram: 10,
    lowestPrice: 20,
    matchSearchedName: 30,
    distance: 20,
    matchPrefHotelClass: 10
  }
}

const suggestFlights = (flights, trip, user, policy, bookedAirlines) => {
  let limitFlight = _.get(trip, 'flightLimitation', 0)
  let minFlight = _.minBy(flights, 'totalPrice')

  let purpose = _.isEmpty(trip) ? 'PERSONAL_TRIP' : 'BUSINESS_TRIP'

  flights = flights.map(flight => {
    let point = 0

    // under budget
    if (flight.totalPrice <= limitFlight) {
      point += SMART_POINTS_FLIGHT[purpose]['underBudget']
    }

    // Match to flight class in Flight policy
    if (
      _.toLower(_.get(flight, 'departureSegments[0].cabinClass')) ===
      _.toLower(_.get(policy, 'flightClass'))
    ) {
      point += SMART_POINTS_FLIGHT[purpose]['matchPolicyClass']
    }

    // Under flight cost limitation in Flight policy
    if (
      _.get(policy, 'setFlightLimit') &&
      flight.totalPrice <= _.get(policy, 'flightLimit')
    ) {
      point += SMART_POINTS_FLIGHT[purpose]['underPolicyLimit']
    }

    // Match to user booking history +15
    if (_.includes(bookedAirlines, flight.departureSegments[0].airline)) {
      point += SMART_POINTS_FLIGHT[purpose]['matchBooked']
    }

    // no stop
    if (flight.departureSegments.length === 1) {
      point += SMART_POINTS_FLIGHT[purpose]['nonStop']
    }

    // cancellable/refundable
    if (flight.refundable) {
      point += SMART_POINTS_FLIGHT[purpose]['refundable']
    }

    // Baggage included
    if (flight.baggageAllowance) {
      point += SMART_POINTS_FLIGHT[purpose]['baggageAllowance']
    }

    // Match to user’s loyalty program +10
    if (
      !_.isEmpty(
        _.find(user.preferenceFlight.flyerPrograms, {
          active: true,
          iata: flight.departureSegments[0].airline
        })
      )
    ) {
      point += SMART_POINTS_FLIGHT[purpose]['matchLoyaltyProgram']
    }

    // Lowest price
    if (flight.totalPrice === minFlight.totalPrice) {
      point += SMART_POINTS_FLIGHT[purpose]['lowestPrice']
    }

    // match prefer flight
    if (
      _.toLower(flight.departureSegments[0].airline) ===
      _.toLower(user.preferenceFlight.prefAirline)
    ) {
      point += SMART_POINTS_FLIGHT[purpose]['matchPreferenceFlight']
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

const suggestHotelRooms = (hotels, request, user, policy, bookedHotels) => {
  let limitHotel = _.get(request, 'trip.hotelLimitation', 0)
  let targetLat = _.get(request, 'roomRequest.geolocation.latitude', 0)
  let targetLng = _.get(request, 'roomRequest.geolocation.longitude', 0)
  let minHotel = _.minBy(hotels, 'lowestPrice')

  let purpose = _.isEmpty(request.trip) ? 'PERSONAL_TRIP' : 'BUSINESS_TRIP'

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
      point += SMART_POINTS_HOTEL[purpose]['underBudget']
    }

    // Match to hotel class in Hotel policy
    if (hotel.starRating === _.get(policy, 'hotelClass')) {
      point += SMART_POINTS_HOTEL[purpose]['matchPolicyClass']
    }

    if (hotel.starRating > _.get(policy, 'hotelClass')) {
      point += SMART_POINTS_HOTEL[purpose]['overPolicyClass']
    }

    // Under hotel cost limitation in Hotel policy
    if (
      _.get(policy, 'setHotelLimit') &&
      hotel.lowestPrice <= _.get(policy, 'hotelLimit')
    ) {
      point += SMART_POINTS_HOTEL[purpose]['underPolicyLimit']
    }

    // Lowest price
    if (hotel.lowestPrice === minHotel.lowestPrice) {
      point += SMART_POINTS_HOTEL[purpose]['lowestPrice']
    }

    // if in favorite hotels
    if (
      _.get(user, 'favoriteHotels', []).some(
        favoriteHotel => Number(favoriteHotel.hotelId) === hotel.hotelId
      )
    ) {
      point += SMART_POINTS_HOTEL[purpose]['matchFavorite']
    }

    // if match hotel name
    if (
      _.toLower(hotel.name)
        .split(' ')
        .every(hotelName =>
          _.includes(_.toLower(request.locationName), hotelName)
        )
    ) {
      point += SMART_POINTS_HOTEL[purpose]['matchSearchedName']
    }

    // distance from search coordinate to hotel coordinate < 150 m
    if (distanceToHotelInMeter <= 150) {
      point += SMART_POINTS_HOTEL[purpose]['distance']
    }

    // Match to user booking history +15
    if (_.includes(bookedHotels, hotel.hotelId)) {
      point += SMART_POINTS_HOTEL[purpose]['matchBooked']
    }

    // match prefer hotel class
    if (hotel.starRating === user.preferenceHotel.prefHotelClass) {
      point += SMART_POINTS_HOTEL[purpose]['matchPrefHotelClass']
    }

    // Match to user’s loyalty program  +10

    return {
      ...hotel,
      point
    }
  })

  // BUSINESS_TRIP Not show hotel if starRating <3
  if (purpose === 'BUSINESS_TRIP') {
    hotels = hotels.filter(hotel => hotel.starRating >= 3)
  }

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
