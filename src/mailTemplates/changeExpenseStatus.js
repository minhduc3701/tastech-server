const moment = require('moment')
function changeExpenseStatus(user, expense) {
  switch (expense.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been approved`,
        html: `Congratulation,  ${user.firstName}! \n\n
          A reimbursement payment for your expense has been marked as Paid by your accountant. Detail:<br/>
          Trip: ${expense._trip.name}<br/>
          Payment date: ${expense.transactionDate}<br/>
          Payment amount: ${expense.amount} ${expense.currency}<br/>
          `
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been rejected`,
        html: `Dear ${user.firstName}! <br/>
          Your following expense claim was rejected:
          Date incurred: ${moment().format('lll')}<br/>
          Trip: ${expense._trip.name}<br/>
          Type: ${expense.category}<br/>
          Description: ${expense.message}<br/>
          Amount:  ${expense.amount} ${expense.currency}<br/>
          Accountant comment:  ${expense.adminMessage}<br/>
          `
      }
  }
}

module.exports = {
  changeExpenseStatus
}
