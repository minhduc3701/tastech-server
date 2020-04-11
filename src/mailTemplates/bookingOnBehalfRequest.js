const { renderMail } = require('../config/mail')
const moment = require('moment')

async function bookingOnBehalfRequest(req, userPartner, company) {
  const { trip, user } = req
  const { requestBookOnBehalfs, budgetPassengers, currency } = trip
  const serviceRequest = {}
  const otherRequirement = {}
  let typeUrl = ''
  requestBookOnBehalfs.forEach(value => {
    if (value.type === 'flight') {
      const {
        price,
        flightType,
        departDate,
        departDestination,
        departDestinationCode,
        returnDestination,
        returnDate,
        returnDestinationCode
      } = budgetPassengers[0].flight
      serviceRequest.flight = {
        name: `${
          flightType === 'round-trip' ? 'Round trip' : 'One way'
        } : ${departDestination} (${departDestinationCode}) - ${returnDestination} (${returnDestinationCode})`,
        time: `Departure: ${moment(departDate).format(
          'DD/MM'
        )}, return: ${moment(returnDate).format('DD/MM')}`,
        class: `Class: ${budgetPassengers[0].flight.class}`,
        budget: `Budget: ${currency} $${price}`,
        note: `Note: ${value.note}`
      }
    } else if (value.type === 'hotel') {
      const {
        checkInDate,
        checkOutDate,
        price,
        regionName
      } = budgetPassengers[0].lodging
      serviceRequest.hotel = {
        name: regionName,
        time: `Checkin: ${moment(checkInDate).format(
          'DD/MM'
        )}, checkout: ${moment(checkOutDate).format('DD/MM')}`,
        class: `Up to ${budgetPassengers[0].flight.class} star`,
        budget: `Budget: ${currency} $${price}`,
        note: `Note: ${value.note}`
      }
    }
    if (value.isChangeable) otherRequirement.isChangeable = 'Changeable'
    if (value.isCancelable) otherRequirement.isCancelable = 'Cancelable'
    typeUrl = value.type
  })

  let html = await renderMail('booking-on-behalf-request', {
    title: '',
    currency,
    userName: userPartner.firstName,
    employeeName: user.firstName,
    employeeEmail: user.email,
    employeePhone: user.phone,
    companyName: company ? company.name : '',

    tripName: trip.name,

    serviceRequest,
    otherRequirement: Object.values(otherRequirement).join('/'),

    companyAvailableBalance: company ? company.remainingCredit : 0,

    reviewLink: `${req.headers.origin}/partner-admin/requests/${
      trip._id
    }/${typeUrl}`
  })
  return {
    to: userPartner.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please check Booking on behalf request for user ${
      user.firstName
    }`,
    html
  }
}

module.exports = {
  bookingOnBehalfRequest
}
