const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function changeTripStatus(user, trip) {
  let htmlTripApproved = await renderMail('trip-approved', {
    title: '',
    name: `${user.firstName}`,
    budget: formatLocaleMoney(
      trip.budgetPassengers[0].totalPrice,
      trip.currency
    ),
    bookLink: `${process.env.APP_URI}/employee/booking?trip=${trip._id}`
  })

  let htmlTripRejected = await renderMail('trip-rejected', {
    title: '',
    name: `${user.firstName}`,
    message: `${trip.adminMessage}`,
    editTripLink: `${process.env.APP_URI}/employee/travel/${trip._id}`
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
