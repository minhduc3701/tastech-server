const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function changeTripStatus(origin, user, trip) {
  let htmlTripApproved = await renderMail('trip-approved', {
    title: '',
    name: `${user.firstName}`,
    budget: formatLocaleMoney(
      trip.budgetPassengers[0].totalPrice,
      trip.currency
    ),
    bookLink: `${origin}/app/employee/booking?trip=${trip._id}`
  })

  let htmlTripRejected = await renderMail('trip-rejected', {
    title: '',
    name: `${user.firstName}`,
    message: `${trip.adminMessage}`,
    editTripLink: `${origin}/app/employee/travel/${trip._id}`
  })

  switch (trip.status) {
    case 'approved':
      return {
        to: user.email,
        from: `${process.env.EMAIL_CONTACT_ALIAS} <${
          process.env.EMAIL_NO_REPLY
        }>`,
        subject: `Your trip request has been approved`,
        html: htmlTripApproved
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `${process.env.EMAIL_CONTACT_ALIAS} <${
          process.env.EMAIL_NO_REPLY
        }>`,
        subject: `Your trip request has been rejected`,
        html: htmlTripRejected
      }
  }
}

module.exports = {
  changeTripStatus
}
