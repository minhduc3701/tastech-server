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
      let currency = ''

      if (!foundTrip) {
        return res.status(400).send()
      }

      let adultPriceBreakdown = ['adtFare', 'adtTax', 'tktFee']

      let serviceFeeBreadkdown = ['platformServiceFee', 'merchantFee']

      let amount = 0

      // if have flight
      if (foundTrip.flight) {
        let adultPrice = adultPriceBreakdown.reduce(
          (acc, fee) => foundTrip.flight[fee] + acc,
          0
        )
        adultPrice *= foundTrip.passengers.length
        let serviceFee = serviceFeeBreadkdown.reduce(
          (acc, fee) => foundTrip.flight[fee] + acc,
          0
        )

        amount += Math.floor((adultPrice + serviceFee) * 100)

        currency = foundTrip.flight.currency
      } // end flight

      // if have hotel
      if (foundTrip.hotel) {
        amount += Math.floor(foundTrip.hotel.room.totalPrice * 100)

        currency = foundTrip.hotel.detail.currency
      }

      // find the card
      let foundCard = await Card.findOne({
        _id: cardId,
        owner: req.user._id
      })

      if (!foundCard) {
        return res.status(400).send()
      }

      // if positive amount
      if (amount > 0 && currency) {
        // When it's time to charge the customer again, retrieve the customer ID.
        const charge = await stripe.charges.create({
          amount,
          currency,
          customer: foundCard.customer.id // Previously stored, then retrieved
        })

        // YOUR CODE: Save the customer ID and other info in a database for later.
        return res.status(200).send({ status: charge.status })
      }

      res.status(400).send()
    } catch (e) {
      res.status(400).send()
    }
  })()
})

router.post('/password', (req, res) => {
  let password = req.body.password

  if (!password) {
    return res.status(400).send()
  }

  req.user.authenticate(password, (err, user, passwordErr) => {
    if (passwordErr) {
      return res.status(400).send()
    }

    res.status(200).send({
      message: 'Verify successfully'
    })
  })
})

module.exports = router
