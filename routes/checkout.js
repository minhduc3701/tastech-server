const express = require('express')
const router = express.Router()

router.post('/', function(req, res, next) {
  const token = req.body.token

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    const charge = await stripe.charges.create({
      amount: 1000, // $10
      currency: 'usd',
      description: 'First charge',
      source: token.id
    })

    res.status(200).send({ charge })
  })()
})

module.exports = router
