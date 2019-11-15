const { renderMail } = require('../config/mail')

async function cancelFlightGiamso(flightOrder) {
  let html = await renderMail('cancel-giamso', {
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.flight.rawTotalPrice}`,
    currency: `${flightOrder.flight.rawCurrency}`,
    flight: flightOrder.flight,
    passengers: flightOrder.passengers
  })
  return {
    to: `${process.env.EMAIL_CONTACT}`,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Cancel flight - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  cancelFlightGiamso
}
