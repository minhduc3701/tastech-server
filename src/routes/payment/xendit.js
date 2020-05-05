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

const { Card } = x
const cardSpecificOptions = {}
const card = new Card(cardSpecificOptions)

const { Payout } = x
const payoutSpecificOptions = {}
const p = new Payout(payoutSpecificOptions)

router.post('/create-invoice', async (req, res) => {
  try {
    i.createInvoice({
      externalID: 'demo_create_invoices',
      amount: 5000000,
      payerEmail: 'vantuan.nguyen1289@gmail.com',
      description: 'Trip to Bali',
      successRedirectURL: `${process.env.APP_URI}/employee/travel`,
      failureRedirectURL: `${process.env.APP_URI}/employee/travel`,
      paymentMethods: []
    })
      .then(resp => {
        const invoice = new XenditInvoice()
        invoice.invoiceId = resp.id
        invoice.externalId = resp.external_id
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
router.post('/refund-invoice', async (req, res) => {
  try {
    // card.createRefund({
    //   chargeID: '5e8dacda1c3e300019b2dabc',
    //   amount: 90020000,
    //   externalID: 'demo_create_invoices',
    resp = await p
      .createPayout({
        externalID: 'test create demo invoice 1',
        amount: 22220,
        email: 'vantuan.nguyen1289@gmail.com'
      })
      .then(resp => {
        console.log('xxxx: ', resp)
        res.status(200).send(resp)
      })
      .catch(err => {
        console.log('yyyy: ', err)
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
