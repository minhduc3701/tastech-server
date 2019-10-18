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
    to: `${process.env.EMAIL_GIAMSO}`,
    from: `EzBizTrip <${process.env.EMAIL_CONTACT}>`,
    cc: `EzBizTrip Support <${process.env.EMAIL_CONTACT}>`,
    subject: `Cancel flight - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  cancelFlightGiamso
}
