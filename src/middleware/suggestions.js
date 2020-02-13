const Order = require('../models/order')
const _ = require('lodash')

const findCompletedOrders = async (req, res, next) => {
  let flightOrders = await Order.find({
    _customer: req.user._id,
    status: { $in: ['processing', 'completed', 'cancelling'] },
    type: 'flight'
  }).limit(5)

  let hotelOrders = await Order.find({
    _customer: req.user._id,
    status: { $in: ['processing', 'completed', 'cancelling'] },
    type: 'hotel'
  }).limit(5)

  req.bookedAirlines = flightOrders.map(order =>
    _.get(order, 'flight.departureSegments[0].airline')
  )

  req.bookedHotels = hotelOrders.map(order => _.get(order, 'hotel.hotelId'))

  next()
}

module.exports = {
  findCompletedOrders
}
