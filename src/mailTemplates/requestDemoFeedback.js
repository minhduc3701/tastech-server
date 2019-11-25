const { renderMail } = require('../config/mail')

async function requestDemoFeedback(data) {
  let html = await renderMail('request-demo-feedback', {
    title: '',
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    company: data.company,
    NoE: data.numberOfEmployees,
    country: data.country,
    appLink: `${process.env.APP_URI}`
  })

  return {
    to: data.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Thank you for requesting demo from EzBizTrip`,
    html
  }
}

module.exports = {
  requestDemoFeedback
}
