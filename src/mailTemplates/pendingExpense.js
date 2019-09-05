const { renderMail } = require('../config/mail')
const moment = require('moment')

async function pendingExpense(accountants, expenses, employee) {
  let html = await renderMail('expense-pending', {
    title: '',
    employeeName: employee.firstName,
    employeeEmail: employee.email,
    tripName: expenses[0]._trip.name,
    expenses: expenses.map(e => ({
      name: e.name,
      category: e.category,
      transactionDate: moment(e.transactionDate).format('ll'),
      amount: Math.round(e.amount).toLocaleString(),
      currency: e.currency,
      message: e.message
    }))
  })

  return {
    to: accountants[0].email,
    cc: accountants.map(e => e.email).splice(1),
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please review your colleague's expense claim`,
    html
  }
}

module.exports = {
  pendingExpense
}
