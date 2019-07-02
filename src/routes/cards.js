const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const { ObjectID } = require('mongodb')

router.post('/', function(req, res, next) {
  const token = req.body.token

  if (!token) {
    return res.status(400).send()
  }

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

router.delete('/:id', (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Card.findOne({
    _id: req.params.id,
    owner: req.user._id
  })
    .then(card => {
      if (!card) {
        return res.status(404).send()
      }

      // delete customer on stripe
      // @see https://stripe.com/docs/api/customers/delete
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      return stripe.customers.del(card.customer.id)
    })
    .then(deleteCustomer => {
      if (!deleteCustomer.deleted) {
        // delete customer failed
        throw new Error()
      }

      // delete card on our db
      return Card.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
      })
    })
    .then(card => {
      res.status(200).send({ card })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
