const { renderMail } = require('../config/mail')
const Order = require('../models/order')

async function sendPnrGiamso(flightOrder) {
  let html = await renderMail('pnr-giamso', {
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.flight.rawTotalPrice}`,
    currency: `${flightOrder.flight.rawCurrency}`,
    flight: flightOrder.flight,
    passengers: flightOrder.passengers
  })

  await Order.populate(flightOrder, ['_customer'])

  return {
    to: `${process.env.EMAIL_GIAMSO}`,
    from: `${process.env.EMAIL_CONTACT_ALIAS} <${flightOrder._customer.email}>`,
    cc: [process.env.EMAIL_CONTACT],
    subject: `Request to issue ticket - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
