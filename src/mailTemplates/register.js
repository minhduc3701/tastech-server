function register(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `New account ${user.email} on ${process.env.APP_URI.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `Congratulation!\n\nYour new account has been created successfully.\n\nPlease set your new password via this link: ${
      process.env.APP_URI
    }/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you have any questions, please contact our Travel Concierge for support.\n
      `
  }
}

module.exports = {
  register
}
