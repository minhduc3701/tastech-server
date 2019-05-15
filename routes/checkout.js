const express = require('express')
const router = express.Router()
const Card = require('../models/card')

router.post('/card', function(req, res, next) {
  const cardId = req.body.card.id

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    try {
      let card = await Card.findOne({
        _id: cardId,
        owner: req.user._id
      })

      if (!card) {
        return res.status(400).send()
      }

      // When it's time to charge the customer again, retrieve the customer ID.
      const charge = await stripe.charges.create({
        amount: 1500, // $15.00 this time
        currency: 'usd',
        customer: card.customer.id // Previously stored, then retrieved
      })

      // YOUR CODE: Save the customer ID and other info in a database for later.
      res.status(200).send({ charge })
    } catch (e) {
      res.status(400).send()
    }
  })()
})

module.exports = router
