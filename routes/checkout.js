const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const Trip = require('../models/trip')

router.post('/card', function(req, res, next) {
  const { card, trip } = req.body
  let cardId = card.id
  let tripId = trip.id

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    try {
      // calculate the trip price here
      let foundTrip = await Trip.findById(tripId)

      if (!foundTrip) {
        return res.status(400).send()
      }

      let adultPriceBreakdown = ['adtFare', 'adtTax', 'tktFee']

      let serviceFeeBreadkdown = ['platformServiceFee', 'merchantFee']

      let adultPrice = adultPriceBreakdown.reduce(
        (acc, fee) => foundTrip.flight[fee] + acc,
        0
      )
      adultPrice *= foundTrip.passengers.length
      let serviceFee = serviceFeeBreadkdown.reduce(
        (acc, fee) => foundTrip.flight[fee] + acc,
        0
      )

      const amount = adultPrice + serviceFee

      // find the card
      let foundCard = await Card.findOne({
        _id: cardId,
        owner: req.user._id
      })

      if (!foundCard) {
        return res.status(400).send()
      }

      // When it's time to charge the customer again, retrieve the customer ID.
      const charge = await stripe.charges.create({
        amount: amount * 100,
        currency: 'usd',
        customer: foundCard.customer.id // Previously stored, then retrieved
      })

      // YOUR CODE: Save the customer ID and other info in a database for later.
      res.status(200).send({ status: charge.status })
    } catch (e) {
      res.status(400).send()
    }
  })()
})

module.exports = router
