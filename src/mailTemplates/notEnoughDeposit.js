const { renderMail } = require('../config/mail')

async function notEnoughDeposit(company) {
  let html = await renderMail('deposit-not-enough', {
    companyName: company.name,
    contactName: company.contactName,
    deposit: company.deposit,
    currency: company.currency
  })
  return {
    to: company.contactEmail,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your company available balance is not enough to book new trip`,
    html
  }
}

module.exports = {
  notEnoughDeposit
}
