const express = require('express')
const router = express.Router()
const Card = require('../models/card')

router.post('/', function(req, res, next) {
  const token = req.body.token

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  ;(async () => {
    // Create a Customer:
    const customer = await stripe.customers.create({
      source: token.id,
      email: req.user.email
    })

    let card = new Card({
      owner: req.user._id,
      customer,
      info: token.card
    })

    card
      .save()
      .then(card => {
        res.status(200).send({
          card: {
            id: card._id,
            brand: card.info.brand,
            last4: card.info.last4
          }
        })
      })
      .catch(e => {
        res.status(400).send()
      })
  })()
})

router.get('/', (req, res) => {
  Card.find({
    owner: req.user._id
  })
    .then(cards => {
      cards = cards.map(card => ({
        id: card._id,
        brand: card.info.brand,
        last4: card.info.last4
      }))
      res.status(200).send({ cards })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
