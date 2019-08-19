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
function requestDemo(data) {
  return {
    to: contactEmail,
    from: `Request Demo - EzBizTrip <${data.email}>`,
    subject: `New request demo from email: ${data.email}`,
    text: `You receiced new request demo! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nCompany: ${data.company} \n\nRole: ${
      data.role
    } \n\nNumber Of Employees: ${data.numberOfEmployees} \n\nCountry: ${
      data.country
    }`
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
function submitTrip(user) {
  return {
    to: user.email,
    from: `EzBizTrip <${noReplyEmail}>`,
    subject: `Your trip request has been submitted`,
    text: `Well done,  ${user.firstName}! \n\n
    Your trip request has been submitted successfully. Our system shall let you know immediately once the your request is approved or not. 
    Still need help?
    Please feel free to contact us if you have any questions, comments or suggestions.
    - Happy travels,
    - The EzBizTrip team
    `
  }
}

module.exports = {
  register,
  forgotPassword,
  contact,
  requestDemo,
  submitTrip
}
