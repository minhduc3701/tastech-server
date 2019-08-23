function changeTripStatus(user, trip) {
  switch (trip.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been approved`,
        text: `Congratulation,  ${user.firstName}! \n\n
          Your trip request has been approved with the following budget limit: ${
            trip.budgetPassengers[0].totalPrice
          } ${trip.currency}
          Please book your trip while the deal is still available.
          Book now
          Also, don't forget to download the Ezbiztrip app to access your trips information and claim expense at your fingertips, anytime you want.
          Still need help?
          Please feel free to contact us if you have any questions, comments or suggestions.
          - Happy travels,
          - The EzBizTrip team
          `
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been rejected`,
        text: `Hello,  ${user.firstName}! \n\n
          Unfortunately, your trip request has been rejected with the following reason: ${
            trip.adminMessage
          }
          Please consider to edit your trip & submit again, or it will be auto closed in 03 days.
          Still need help?
          Please feel free to contact us if you have any questions, comments or suggestions.
          - Happy travels,
          - The EzBizTrip team
          `
      }
  }
}

module.exports = {
  changeTripStatus
}
