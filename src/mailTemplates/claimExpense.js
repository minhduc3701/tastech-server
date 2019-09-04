const { renderMail } = require('../config/mail')

function claimExpense(user) {
  let html = renderMail('expense-claimed', {
    title: '',
    name: user.name
  })
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your Expense Claim has been submitted`,
    html
  }
}

module.exports = {
  claimExpense
}
