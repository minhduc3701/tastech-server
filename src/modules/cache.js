const _ = require('lodash')

const makePkfareFlightCacheKey = request => {
  let key = _.toString(request.adults) + _.toString(request.nonstop)

  _.get(request, 'searchAirLegs', []).forEach(segment => {
    key += `${segment.origin}${segment.destination}${segment.departureDate}${
      segment.cabinClass
    }`
  })

  return key
}

const makeHotelBedsCacheKey = request => {
  let key = `${_.get(request, 'geolocation.latitude', '')}${_.get(
    request,
    'geolocation.longitude',
    ''
  )}${_.get(request, 'geolocation.radius', '')}${_.get(
    request,
    'geolocation.unit',
    ''
  )}${request.occupancies[0].adults}${request.occupancies[0].children}${
    request.occupancies[0].rooms
  }${request.stay.checkIn}${request.stay.checkOut}`

  _.get(request, 'occupancies[0].paxes', []).forEach(pax => {
    key += `${pax.type}${pax.age}`
  })

  _.get(request, 'hotels.hotel', []).forEach(hotel => {
    key += `${hotel}`
  })

  return key
}

module.exports = {
  makePkfareFlightCacheKey,
  makeHotelBedsCacheKey
}
