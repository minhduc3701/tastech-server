const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const Company = require('../models/company')
const User = require('../models/user')
const Order = require('../models/order')
const { ObjectID } = require('mongodb')

router.get('/', function(req, res, next) {
  Trip.find({
    _creator: req.user._id,
    archived: { $ne: true }
  })
    .sort({ updatedAt: -1 })
    .then(trips => {
      res.send({ trips })
    })
    .catch(e => {
      res.send({ error: 'Not Found' })
    })
})

// response approved trips for booking
router.get('/booking', (req, res) => {
  Trip.find({
    _company: req.user._company,
    _creator: req.user._id,
    status: 'approved'
  })
    .then(trips => res.status(200).send({ trips }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Trip.findOne({
    _creator: req.user._id,
    _id: req.params.id
  })
    .populate('updatedByAdmin')
    .then(trip => {
      res.status(200).json({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res, next) {
  const trip = new Trip(req.body)
  trip._creator = req.user._id
  trip._company = req.user._company
  trip
    .save()
    .then(() => {
      res.status(200).json({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Trip.findByIdAndUpdate(id, { $set: req.body }, { new: true })
    .then(trip => {
      if (!trip) {
        return res.status(404).send()
      }

      res.status(200).send({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

// get expenses by trip id
router.get('/:id/expenses', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Promise.all([
    Trip.findById(id),
    Expense.find({
      _creator: req.user._id,
      _trip: id
    }).sort({ updatedAt: -1 })
  ])
    .then(results => {
      let trip = results[0]
      let expenses = results[1]

      res.status(200).send({ trip, expenses })
    })
    .catch(e => res.status(400).send())
})

// get orders by trip
router.get('/:id/orders', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Order.find({
    _customer: req.user._id,
    _trip: id
  })
    .then(orders => {
      res.status(200).send({ orders })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id/exchange', function(req, res, next) {
  let id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Promise.all([
    Trip.findOneAndUpdate(
      {
        _id: id,
        _creator: req.user._id,
        status: 'finished'
      },
      { $set: { status: 'completed' } },
      { new: true }
    ),
    Expense.find({
      _creator: req.user._id,
      _trip: id,
      status: 'approved'
    }),
    Company.findById(req.user._company)
  ])
    .then(result => {
      let trip = result[0]
      let expenses = result[1]
      let company = result[2]
      let budget = trip.budgetPassengers[0].totalPrice
      let totalAmount = 0
      let saveAmount = 0
      expenses.map(expense => {
        totalAmount += expense.amount
      })
      if (budget > totalAmount) {
        saveAmount = budget - totalAmount
      }
      let rate = company.exchangedRate
      let point = Math.round((saveAmount * rate) / 100)
      return User.findByIdAndUpdate(
        req.user._id,
        { $inc: { point: point } },
        { new: true }
      )
    })
    .then(user => {
      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
