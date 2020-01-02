const { renderMail } = require('../config/mail')
const moment = require('moment')
const { formatLocaleMoney } = require('../modules/utils')
const _ = require('lodash')

async function changeExpenseStatus(user, expense) {
  let htmlExpenseApproved = await renderMail('expense-approved', {
    title: '',
    employeeName: user.firstName,
    tripName: _.get(expense, '_trip.name'),
    paymentDate: moment(expense.transactionDate).format('ll'),
    paymentAmount: formatLocaleMoney(expense.amount, expense.currency),
    expenseLink: `${process.env.APP_URI}/employee/expenses/${expense._id}`
  })

  let htmlExpenseRejected = await renderMail('expense-rejected', {
    title: '',
    employeeName: user.firstName,
    dateIncurred: moment().format('ll'),
    tripName: expense._trip.name,
    type: expense.category,
    description: expense.message,
    amount: formatLocaleMoney(expense.amount, expense.currency),
    adminMessage: expense.adminMessage,
    expenseLink: `${process.env.APP_URI}/employee/expenses/${expense._id}`
  })

  switch (expense.status) {
    case 'approved':
      return {
        to: user.email,
        from: `${process.env.EMAIL_CONTACT_ALIAS} <${
          process.env.EMAIL_NO_REPLY
        }>`,
        subject: `Your expense has been reimbursed`,
        html: htmlExpenseApproved
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `${process.env.EMAIL_CONTACT_ALIAS} <${
          process.env.EMAIL_NO_REPLY
        }>`,
        subject: `Your expense claim has been rejected`,
        html: htmlExpenseRejected
      }
  }
}

module.exports = {
  changeExpenseStatus
}
