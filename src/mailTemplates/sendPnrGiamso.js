const { renderMail } = require('../config/mail')

async function sendPnrGiamso(flightOrder) {
  let html = await renderMail('pnr-giamso', {
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.rawTotalPrice}`,
    currency: `${flightOrder.rawCurrency}`,
    passengers: flightOrder.passengers
  })
  return {
    to: `${process.env.EMAIL_GIAMSO}`,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Request to issue ticket - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
