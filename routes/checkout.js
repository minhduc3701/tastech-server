const express = require('express')
const router = express.Router()

router.post('/', function(req, res, next) {
  const token = req.body.token

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    // Create a Customer:
    const customer = await stripe.customers.create({
      source: token.id,
      email: 'paying.user.1@example.com'
    })

    // Charge the Customer instead of the card:
    const charge = await stripe.charges.create({
      amount: 1000,
      currency: 'usd',
      customer: customer.id
    })

    // YOUR CODE: Save the customer ID and other info in a database for later.
    res.status(200).send({ charge, customer })
  })()
})

router.post('/card', function(req, res, next) {
  const card = req.body.card

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    // When it's time to charge the customer again, retrieve the customer ID.
    const charge = await stripe.charges.create({
      amount: 1500, // $15.00 this time
      currency: 'usd',
      customer: card.customerId // Previously stored, then retrieved
    })

    // YOUR CODE: Save the customer ID and other info in a database for later.
    res.status(200).send({ charge })
  })()
})

module.exports = router
