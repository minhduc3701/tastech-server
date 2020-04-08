const express = require('express')
const router = express.Router()
const Xendit = require('xendit-node')
const XenditInvoice = require('../../models/invoice')
const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
})
const { Invoice } = x
const invoiceSpecificOptions = {}
const i = new Invoice(invoiceSpecificOptions)

router.post('/create-invoice', async (req, res) => {
  try {
    i.createInvoice({
      externalID: 'demo_create_invoices',
      amount: 90020000,
      payerEmail: 'vantuan.nguyen1289@gmail.com',
      description: 'Trip to Bali',
      successRedirectURL: 'https://www.ezbiztrip.com/xendit/payment-success',
      failureRedirectURL: 'https://www.ezbiztrip.com/xendit/payment-fail',
      paymentMethods: []
    })
      .then(resp => {
        const invoice = new XenditInvoice()
        invoice.invoiceId = resp.id
        invoice.status = resp.status
        invoice.payerEmail = resp.payer_email
        invoice.amount = resp.amount
        invoice.description = resp.description
        invoice.invoiceUrl = resp.invoice_url
        invoice.expiryDate = resp.expiry_date
        invoice.availableBanks = resp.available_banks
        invoice.currency = resp.currency
        invoice.save().then(() => {
          return res.status(200).send(invoice)
        })
      })
      .catch(err => {
        res.status(400).send(err)
      })
  } catch (e) {
    res.status(400).send()
  }
})
router.post('/payment-result', async (req, res) => {
  try {
    let invoice = await XenditInvoice.findOneAndUpdate(
      { invoiceId: req.body.id },
      { $set: { status: req.body.status, callBack: req.body } },
      { new: true }
    )
    res.status(200).send(invoice)
  } catch (error) {
    res.status(400).send(err)
  }
})
module.exports = router
