const { renderMail } = require('../config/mail')

async function forgotPassword(user, token) {
  let html = await renderMail('reset-password', {
    title: 'Reset Your Password',
    resetLink: `${process.env.APP_URI}/reset-password/${token}`
  })

  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Reset Your Password`,
    html
  }
}

module.exports = {
  forgotPassword
}
