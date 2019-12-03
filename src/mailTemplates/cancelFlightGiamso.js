const { renderMail } = require('../config/mail')

async function cancelFlightGiamso(flightOrder) {
  let html = await renderMail('cancel-giamso', {
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
    subject: `Cancel flight - ${flightOrder.customerCode}`,
    html
  }
}

module.exports = {
  cancelFlightGiamso
}
