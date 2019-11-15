const { renderMail } = require('../config/mail')

async function claimExpense(user) {
  let html = await renderMail('expense-claimed', {
    title: '',
    name: user.firstName
  })
  return {
    to: user.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your Expense Claim has been submitted`,
    html
  }
}

module.exports = {
  claimExpense
}
