function pendingTrip(managers, trip, employee) {
  let text = `Hello! \n\n
    ${employee.firstName} is seeking for your approval on below trip request:
    ${trip.name}
    Start date: ${trip.startDate}  
    End date: ${trip.endDate}
    Service request: \n`

  let {
    flight,
    lodging,
    transportation,
    meal,
    others
  } = trip.budgetPassengers[0]
  if (flight.selected) {
    text += `- Flight: \n ${flight.departDestination} (${
      flight.departDestinationCode
    }) - ${flight.returnDestination} (${flight.returnDestinationCode}),  \n
      departure: ${flight.departDate} \n`
    if (flight.flightType === 'round-trip') {
      text += `, return: ${flight.returnDate} \n`
    }
  }
  if (lodging.selected) {
    text += `- Lodging: ${lodging.regionName}, checkin: ${
      lodging.checkInDate
    }, checkout: ${lodging.checkOutDate} \n`
  }

  if (transportation.selected) {
    text += `- Transportation: ${trip.daysOfTrip} day(s) \n`
  }

  if (meal.selected) {
    text += `- Daily meal: ${trip.daysOfTrip} day(s) \n`
  }

  if (others.selected) {
    text += `- Other: ${Math.round(others.amount)} ${trip.currency} \n`
    text += `- Note: ${others.reason} \n`
  }

  text += `
      Estimated budget: ${trip.budgetPassengers[0].totalPrice} ${
    trip.currency
  } \n
      Still need help?
      Please feel free to contact us if you have any questions, comments or suggestions.
      - Happy travels,
      - The EzBizTrip team`
  return {
    to: managers[0].email,
    cc: managers.map(e => e.email).splice(1),
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please review your colleagues's trip request`,
    text
  }
}
module.exports = {
  pendingTrip
}
