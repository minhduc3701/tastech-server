const { renderMail } = require('../config/mail')

async function forgotPassword(origin, user, token) {
  let html = await renderMail('reset-password', {
    title: 'Reset Your Password',
    name: `${user.firstName}`,
    email: user.email,
    resetLink: `${origin}/reset-password/${token}`
  })

  return {
    to: user.email,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Reset Your Password`,
    html
  }
}

module.exports = {
  forgotPassword
}
