const { renderMail } = require('../config/mail')

async function register(user, token, userCreater) {
  let html
  if (
    userCreater &&
    user._role.type === 'admin' &&
    userCreater._role.type === 'tas-admin'
  ) {
    html = await renderMail('register-admin', {
      title: 'Welcome to EzBizTrip',
      link: `${process.env.APP_URI}/reset-password/${token}`,
      user,
      loginLink: `${process.env.APP_URI}`,
      note:
        process.env.ENV === 'production'
          ? 'We have created account for you:'
          : 'We have created 30 days demo account for you:'
    })
  } else {
    html = await renderMail('register', {
      title: 'Welcome to EzBizTrip',
      link: `${process.env.APP_URI}/reset-password/${token}`,
      user
    })
  }
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
