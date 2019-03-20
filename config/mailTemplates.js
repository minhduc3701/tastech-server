function register() {
  return 'Your new account is created successfully.'
}

function forgotPassword(token) {
  return (
    'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
    process.env.APP_URI +
    '/reset-password/' +
    token +
    '\n\n' +
    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  )
}

module.exports = {
  register,
  forgotPassword
}
