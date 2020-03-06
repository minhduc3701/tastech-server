const _ = require('lodash')
const { renderMail } = require('../config/mail')
const moment = require('moment')
const { formatLocaleMoney } = require('../modules/utils')

async function tripItinerary(origin, user, orders, airlines, airports) {
  orders = orders.map(order => order.toObject())

  let html = await renderMail('trip-itinerary', {
    title: '',
    name: user.firstName,
    flightOrders: orders
      .filter(order => order.type === 'flight')
      .map(order => {
        return {
          ...order,
          totalPrice: formatLocaleMoney(order.totalPrice, order.currency),
          flight: {
            departureSegments: _.get(order, 'flight.departureSegments', []).map(
              segment => ({
                ...segment,
                departureTime: moment(segment.departureDate).format(
                  'HH:mm - ll'
                ),
                arrivalTime: moment(segment.arrivalDate).format('HH:mm - ll')
              })
            ),
            returnSegments: _.get(order, 'flight.returnSegments', []).map(
              segment => ({
                ...segment,
                departureTime: moment(segment.departureDate).format(
                  'HH:mm - ll'
                ),
                arrivalTime: moment(segment.arrivalDate).format('HH:mm - ll')
              })
            )
          },
          payment: {
            type: _.get(order, 'chargeInfo.paymentType'),
            brand: _.get(order, 'chargeInfo.payment_method_details.card.brand'),
            last4: _.get(order, 'chargeInfo.payment_method_details.card.last4')
          }
        }
      }),
    hotelOrders: orders
      .filter(order => order.type === 'hotel')
      .map(order => ({
        ...order,
        totalPrice: formatLocaleMoney(order.totalPrice, order.currency),
        hotel: {
          ...order.hotel,
          checkInDate: moment(order.hotel.checkInDate).format('ll'),
          checkOutDate: moment(order.hotel.checkOutDate).format('ll')
        },
        payment: {
          type: _.get(order, 'chargeInfo.paymentType'),
          brand: _.get(order, 'chargeInfo.payment_method_details.card.brand'),
          last4: _.get(order, 'chargeInfo.payment_method_details.card.last4')
        }
      })),
    tripLink: `${origin}/employee/travel/${_.get(
      orders,
      '[0]._trip'
    )}?tab=itinerary`,
    airlines,
    airports
  })

  return {
    to: user.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Booking confirmation for your Trip`,
    html
  }
}

module.exports = {
  tripItinerary
}
