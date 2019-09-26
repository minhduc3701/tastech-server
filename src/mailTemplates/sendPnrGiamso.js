const { renderMail } = require('../config/mail')

async function sendPnrGiamso(flightOrder) {
  let html = await renderMail('pnr-giamso', {
    pnr: `${flightOrder.pnr}`,
    price: `${flightOrder.rawCurrency}`,
    currency: `${flightOrder.rawTotalPrice}`,
    passengers: flightOrder.passengers
  })
  return {
    to: 'tas@giamso.com.sg',
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Request to issue ticket - ${flightOrder.pnr}`,
    html
  }
}

module.exports = {
  sendPnrGiamso
}
