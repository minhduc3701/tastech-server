const { renderMail } = require('../config/mail')

async function sendPnrGiamso(flightOrder) {
  let html = await renderMail('pnr-giamso', {
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.flight.rawTotalPrice}`,
    currency: `${flightOrder.flight.rawCurrency}`,
    flight: flightOrder.flight,
    passengers: flightOrder.passengers
  })
  return {
    to: `${process.env.EMAIL_GIAMSO}`,
    from: `EzBizTrip <${process.env.EMAIL_CONTACT}>`,
    cc: `EzBizTrip Support <${process.env.EMAIL_CONTACT}>`,
    subject: `Request to issue ticket - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
