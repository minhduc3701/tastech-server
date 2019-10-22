const { renderMail } = require('../config/mail')
const { formatLocaleMoney } = require('../modules/utils')

async function sendVoucherInfo(user, gift) {
  let html = await renderMail('voucher-info', {
    user,
    gift,
    customer: gift.customerInfo,
    price: formatLocaleMoney(gift.price, gift.currency)
  })
  return {
    to: process.env.EMAIL_CONTACT,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `${gift.customerInfo.email} requests for voucher "${gift.title}"`,
    html
  }
}

module.exports = {
  sendVoucherInfo
}
