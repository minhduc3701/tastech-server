const { renderMail } = require('../config/mail')

async function register(user, token, userCreator) {
  let html
  let bcc
  if (
    userCreator &&
    user._role.type === 'admin' &&
    userCreator._role.type === 'tas-admin'
  ) {
    ;(bcc = [process.env.EMAIL_SALES]),
      (html = await renderMail('register-admin', {
        title: 'Welcome to EzBizTrip',
        link: `${process.env.APP_URI}/reset-password/${token}`,
        user,
        loginLink: `${process.env.APP_URI}/login`,
        note:
          process.env.NODE_ENV === 'production'
            ? 'We have created account for you:'
            : 'We have created 30 days demo account for you:'
      }))
  } else {
    html = await renderMail('register', {
      title: 'Welcome to EzBizTrip',
      link: `${process.env.APP_URI}/reset-password/${token}`,
      user
    })
  }
  return {
    to: user.email,
    bcc,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Welcome to EzBizTrip`,
    html
  }
}

module.exports = {
  register
}
