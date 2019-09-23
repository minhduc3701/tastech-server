const { renderMail } = require('../config/mail')
const moment = require('moment')
const { formatLocaleMoney } = require('../modules/utils')

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
      amount: formatLocaleMoney(e.amount, e.currency),
      message: e.message
    })),
    reviewLink: `${process.env.APP_URI}/admin/expenses/${expenses[0]._id}`
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
