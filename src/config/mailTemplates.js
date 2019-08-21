const noReplyEmail = 'no-reply@ezbiztrip.com'
const appUrl = process.env.APP_URI
const contactEmail = process.env.EMAIL_CONTACT

function contact(data) {
  return {
    to: contactEmail,
    from: `Help - EzBizTrip <${data.email}>`,
    subject: `New message from email: ${data.email}`,
    text: `You receiced new message! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nMessage: ${data.message} \n\n
    `
  }
}
function requestDemo(data) {
  return {
    to: contactEmail,
    from: `Request Demo - EzBizTrip <${data.email}>`,
    subject: `New request demo from email: ${data.email}`,
    text: `You receiced new request demo! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nCompany: ${data.company} \n\nRole: ${
      data.role
    } \n\nNumber Of Employees: ${data.numberOfEmployees} \n\nCountry: ${
      data.country
    }`
  }
}

function register(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `New account ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `Congratulation!\n\nYour new account has been created successfully.\n\nPlease set your new password via this link: ${appUrl}/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you have any questions, please contact our Travel Concierge for support.\n
    `
  }
}

function forgotPassword(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Password Reset for ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${appUrl}/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n
    `
  }
}
function submitTrip(user) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Your trip request has been submitted`,
    text: `Well done,  ${user.firstName}! \n\n
    Your trip request has been submitted successfully. Our system shall let you know immediately once the your request is approved or not. 
    `
  }
}
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
  Estimated budget: ${trip.budgetPassengers[0].totalPrice} ${trip.currency} \n
  Still need help?
  Please feel free to contact us if you have any questions, comments or suggestions.
  - Happy travels,
  - The EzBizTrip team`
  return {
    to: managers[0].email,
    cc: managers.map(e => e.email).splice(1),
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Please review your colleagues's trip request`,
    text
  }
}
function changeTripStatus(user, trip) {
  switch (trip.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${noReplyEmail}>`,
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
        from: `EzBizTrip <${noReplyEmail}>`,
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

function claimExpense(user) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Your Expense Claim has been submitted`,
    text: `Well done,  ${user.firstName}! \n\n
    Your expense claim has been sent to your accounting department successfully. 
    Please wait for their process.
    In the mean time, you can check the status any time.
    `
  }
}

function pendingExpense(accountants, expenses, employee) {
  let text = `Hello! \n\n
  ${employee.firstName} (${
    employee.email
  }) has sent an expense claim for reimbursement as below:
  ${expenses[0]._trip.name}
  ------------------------------------------------`
  expenses.map(expense => {
    text += ` 
    Name of expense:  ${expense.name}
    Expense category: ${expense.category}
    Transaction date: ${expense.transactionDate}
    Amount: ${expense.amount} ${expense.currency}
    Description: ${expense.message}
    --------------------------------------------------
    `
  })
  return {
    to: accountants[0].email,
    cc: accountants.map(e => e.email).splice(1),
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Please review your colleague's expense claim`,
    text
  }
}

function changeExpenseStatus(user, expense) {
  switch (expense.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${noReplyEmail}>`,
        subject: `Your trip request has been approved`,
        text: `Congratulation,  ${user.firstName}! \n\n
        A reimbursement payment for your expense has been marked as Paid by your accountant. Detail:
        Trip: ${expense._trip.name}
        Payment date: ${expense.transactionDate}
        Payment amount: ${expense.amount} ${expense.currency}
        `
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `EzBizTrip <${noReplyEmail}>`,
        subject: `Your trip request has been rejected`,
        text: `Dear ${user.firstName}! \n\n
        Your following expense claim was rejected:
        Date incurred: ${Date.now()}
        Trip: ${expense._trip.name}
        Type: ${expense.category}
        Description: ${expense.message}
        Amount:  ${expense.amount} ${expense.currency}
        Accountant comment:  ${expense.adminMessage}
        `
      }
  }
}

module.exports = {
  register,
  forgotPassword,
  contact,
  requestDemo,
  submitTrip,
  changeTripStatus,
  pendingTrip,
  claimExpense,
  pendingExpense,
  changeExpenseStatus
}
