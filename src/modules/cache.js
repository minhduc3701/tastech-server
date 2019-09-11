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

module.exports = {
  makePkfareFlightCacheKey
}
