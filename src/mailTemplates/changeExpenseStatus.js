const { renderMail } = require('../config/mail')
const moment = require('moment')

async function changeExpenseStatus(user, expense) {
  let htmlExpenseApproved = await renderMail('expense-approved', {
    title: '',
    employeeName: user.firstName,
    tripName: expense._trip.name,
    paymentDate: moment(expense.transactionDate).format('ll'),
    paymentAmount: `${expense.amount} ${expense.currency}`
  })

  let htmlExpenseRejected = await renderMail('expense-rejected', {
    title: '',
    employeeName: user.firstName,
    dateIncurred: moment().format('ll'),
    tripName: expense._trip.name,
    type: expense.category,
    description: expense.message,
    amount: `${expense.amount} ${expense.currency}`,
    adminMessage: expense.adminMessage
  })

  switch (expense.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your expense has been reimbursed`,
        html: htmlExpenseApproved
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your expense claim has been rejected`,
        html: htmlExpenseRejected
      }
  }
}

module.exports = {
  changeExpenseStatus
}
