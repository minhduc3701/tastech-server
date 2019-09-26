// const { renderMail } = require('../config/mail')

async function sendPnrGiamso(user, flightOrder) {
  let html = await renderMail('pnr-giamso', {
    title: `Request to issue ticket - ${a}`,
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.rawCurrency}`,
    currency: `${flightOrder.rawTotalPrice}`,
    passengers: `${flightOrder.passengers}`
  })
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
