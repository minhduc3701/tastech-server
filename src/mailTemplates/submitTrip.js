const { renderMail } = require('../config/mail')

async function submitTrip(user) {
  let html = await renderMail('trip-submitted', {
    title: '',
    name: `${user.firstName}`
  })
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your trip request has been submitted`,
    html
  }
}

module.exports = {
  submitTrip
}
