const { renderMail } = require('../config/mail')

async function sendPnrGiamso(flightOrder) {
  let html = await renderMail('pnr-giamso', {
    pnr: `${flightOrder.customerCode}`,
    price: `${flightOrder.flight.rawTotalPrice}`,
    currency: `${flightOrder.flight.rawCurrency}`,
    flight: flightOrder.flight,
    passengers: flightOrder.passengers,
    contactInfo: flightOrder.contactInfo
  })
  return {
    to: `${process.env.EMAIL_GIAMSO}`,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    cc: [process.env.EMAIL_CONTACT],
    subject: `Request to issue ticket - ${flightOrder.customerCode}`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
