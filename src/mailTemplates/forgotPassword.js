function forgotPassword(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Password Reset for ${user.email} on ${process.env.APP_URI.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${
      process.env.APP_URI
    }/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n
      `
  }
}

module.exports = {
  forgotPassword
}
