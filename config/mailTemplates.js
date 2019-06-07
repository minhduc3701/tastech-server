const noReplyEmail = 'no-reply@ezbiztrip.com'
const appUrl = process.env.APP_URI

function register(user, token) {
  return {
    to: user.email,
    from: noReplyEmail,
    subject: `New account ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text:
      'Your new account is created successfully.\n' +
      'To change password, please click on the following link, or paste this into your browser to complete the process:\n\n' +
      appUrl +
      '/reset-password/' +
      token
  }
}

function forgotPassword(user, token) {
  return {
    to: user.email,
    from: 'no-reply@ezbiztrip.com',
    subject: `Password Reset for ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text:
      'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      appUrl +
      '/reset-password/' +
      token +
      '\n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  }
}

module.exports = {
  register,
  forgotPassword
}
