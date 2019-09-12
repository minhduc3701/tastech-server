const { renderMail } = require('../config/mail')

async function register(user, token) {
  let html = await renderMail('register', {
    title: 'Welcome to EzBizTrip',
    link: `${process.env.APP_URI}/reset-password/${token}`,
    user
  })
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Welcome to EzBizTrip`,
    html
  }
}

module.exports = {
  register
}
