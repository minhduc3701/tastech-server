const _ = require('lodash')

function tripItinerary(user, orders) {
  let flightOrders = orders.filter(order => order.type === 'flight')
  let hotelOrders = orders.filter(order => order.type === 'hotel')
  let totalPrice = 0
  let currency = ''
  let html = `<style>div { color:red; }</style> 
  <div>Hello,  ${user.firstName}! Your trip booking is confirmed`

  if (!_.isEmpty(flightOrders)) {
    html += `<br/> Flight Itinerary <br/>`
    html += `<hr/>`
    flightOrders.map(flightOrder => {
      totalPrice += flightOrder.totalPrice
      let flight = flightOrder.flight
      flight.departureSegments.map(segment => {
        html += `Departure date: ${segment.strDepartureDate} <br/>
        departure: ${segment.departure} - time: ${
          segment.strDepartureTime
        } <br/>
        Arrival date: ${segment.strArrivalDate} <br/>
        Arrival: ${segment.arrival} - time: ${segment.strArrivalTime} <br/>
        Class: ${segment.cabinClass} <hr/>
        `
      })
      if (!_.isEmpty(flight.returnSegments)) {
        flight.returnSegments.map(segment => {
          html += `Departure date: ${segment.strDepartureDate} <br/>
          departure: ${segment.departure} - time: ${
            segment.strDepartureTime
          } <br/>
          Arrival date: ${segment.strArrivalDate} <br/>
          Arrival: ${segment.arrival} - time: ${segment.strArrivalTime} <br/>
          Class: ${segment.cabinClass} <hr/>
          `
        })
      }
      html += `<hr/>`
    })
  }

  if (!_.isEmpty(hotelOrders)) {
    currency = hotelOrders[0].currency
    html += `<br/> Lodging <br/>`
    hotelOrders.map(hotelOrder => {
      totalPrice += hotelOrder.totalPrice
      let hotel = hotelOrder.hotel
      html += `${hotel.name} <br/> ${hotel.address} <br/> 
      ${hotel.checkInDate} <br/> ${hotel.checkOutDate} <br/>
      ${hotel.roomName} <br/> `
      html += `Guest <br/>`
      hotelOrder.passengers.map((passenger, index) => {
        html += `${index + 1}. ${passenger.firstName} ${passenger.lastName}`
      })
      html += `<hr/>`
    })
  }
  html += `Total price: ${Math.round(totalPrice)} ${currency}`
  html += `</div>`
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `EzBizTrip Booking confirmation for your Trip`,
    html
  }
}

module.exports = {
  tripItinerary
}
