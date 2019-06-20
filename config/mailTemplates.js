const noReplyEmail = 'no-reply@ezbiztrip.com'
const appUrl = process.env.APP_URI
const contactEmail = process.env.EMAIL_CONTACT

function contact(data) {
  return {
    to: contactEmail,
    from: `Help - EzBizTrip <${data.email}>`,
    subject: `New message from email: ${data.email}`,
    text: `You receiced new message! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nMessage: ${data.message} \n\n
    `
  }
}

function register(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `New account ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `Congratulation!\n\nYour new account has been created successfully.\n\nPlease set your new password via this link: ${appUrl}/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you have any questions, please contact our Travel Concierge for support.\n
    `
  }
}

function forgotPassword(user, token) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Password Reset for ${user.email} on ${appUrl.replace(
      /^https?:\/\//,
      ''
    )}`,
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${appUrl}/reset-password/${token}\n\nThe link will be expire next 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n
    `
  }
}

module.exports = {
  register,
  forgotPassword,
  contact
}
