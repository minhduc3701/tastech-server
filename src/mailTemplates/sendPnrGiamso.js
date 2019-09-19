// const { renderMail } = require('../config/mail')

function sendPnrGiamso(user, flight) {
  let html = '<p>test mail </p> ' + JSON.stringify(flight)
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Request to issue ticket`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
