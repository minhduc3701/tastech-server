const express = require('express')
const router = express.Router()
const Expense = require('../models/expense')
const Trip = require('../models/trip')
const { ObjectID } = require('mongodb')
const { upload } = require('../config/aws')
const _ = require('lodash')

router.post('/', upload.array('receipts'), function(req, res, next) {
  const expense = new Expense(req.body)
  expense._creator = req.user._id
  expense._company = req.user._company
  if (!_.isEmpty(req.files)) {
    expense.receipts = req.files.map(file => file.key)
  }
  if (!_.isEmpty(req.body._attendees)) {
    expense._attendees = req.body._attendees.split(',')
  } else {
    expense._attendees = []
  }
  // check trip's status
  Trip.findById(expense._trip)
    .then(trip => {
      if (!['approved', 'ongoing', 'finished'].includes(trip.status)) {
        res.status(400).send()
      }
    })
    .catch(e => {
      res.status(400).send()
    })
  expense
    .save()
    .then(() => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', function(req, res, next) {
  let availableTripIds = []
  Trip.find({
    _creator: req.user._id,
    archived: { $ne: true }
  })
    .then(trips => {
      trips.map(trip => {
        availableTripIds.push(trip._id)
      })
      return Expense.find({
        _creator: req.user._id,
        _trip: { $in: availableTripIds }
      })
        .sort({ updatedAt: -1 })
        .populate('_trip')
        .populate('_attendees', 'email')
    })
    .then(expenses => {
      res.status(200).json({ expenses })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/ongoing', function(req, res, next) {
  Trip.find({
    _creator: req.user._id,
    status: 'ongoing'
  })
    .sort({ createdAt: -1 })
    .limit(1)
    .then(trips => {
      return Promise.all([
        trips[0].budgetPassengers[0].totalPrice,
        Expense.aggregate([
          {
            $match: {
              _creator: req.user._id,
              _trip: { $eq: trips[0]._id },
              status: 'approved'
            }
          },
          {
            $group: {
              _id: '',
              totalExpenses: {
                $sum: '$amount'
              }
            }
          },
          {
            $project: {
              _id: 0,
              totalExpenses: '$totalExpenses'
            }
          }
        ]),
        Expense.aggregate([
          {
            $match: {
              _creator: req.user._id,
              _trip: { $eq: trips[0]._id },
              status: 'approved'
            }
          },
          {
            $group: {
              _id: '$category',
              category: { $first: '$category' },
              amount: { $sum: '$amount' }
            }
          },
          {
            $project: {
              _id: 0,
              category: '$category',
              amount: '$amount'
            }
          }
        ])
      ])
    })

    .then(results => {
      res.status(200).json({
        totalBudgets: results[0],
        totalExpenses: results[1][0].totalExpenses,
        expenses: results[2]
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Expense.findOne({
    _creator: req.user._id,
    _id: req.params.id
  })
    .populate('_trip', 'name')
    .populate('_attendees', 'email')
    .then(expense => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', upload.array('receipts'), function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let body = _.pick(req.body, [
    '_attendees',
    'name',
    'amount',
    'category',
    'claimed',
    'transactionDate',
    'status',
    '_trip',
    'account',
    'message',
    'city',
    'vendor',
    'oldReceipts'
  ])
  body.receipts = []
  if (!_.isEmpty(body.oldReceipts)) {
    body.receipts = body.oldReceipts.split(',')
  }
  if (!_.isEmpty(req.files)) {
    body.receipts = body.receipts.concat(req.files.map(file => file.key))
  }
  if (!_.isEmpty(body._attendees)) {
    body._attendees = req.body._attendees.split(',')
  } else {
    body._attendees = []
  }
  if (body.status === 'rejected') {
    body.status = 'waiting'
  }
  Expense.findOneAndUpdate(
    {
      _id: req.params.id,
      _creator: req.user.id,
      status: {
        $in: ['waiting', 'rejected']
      }
    },
    { $set: body },
    { new: true }
  )

    .then(expense => {
      if (!expense) {
        return res.status(404).send()
      }

      res.status(200).send({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/', function(req, res, next) {
  let { expenseIds } = req.body
  try {
    Expense.updateMany(
      {
        _creator: req.user.id,
        _id: { $in: expenseIds }
      },
      { $set: { status: 'claiming' } },
      function(err, result) {
        if (err) return res.status(400).send()
        res.status(200).json({ expenseIds, status: 'claiming' })
      }
    )
  } catch (error) {
    res.status(400).send()
  }
})

router.delete('/', function(req, res) {
  let { expenseIds } = req.body
  try {
    Expense.deleteMany(
      {
        _creator: req.user.id,
        _id: { $in: expenseIds },
        status: { $ne: 'approved' }
      },
      function(err, result) {
        if (err) return res.status(400).send()
        res.status(200).json({ expenseIds })
      }
    )
  } catch (error) {
    res.status(400).send(error)
  }
})

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Expense.findOneAndDelete({
    _id: req.params.id,
    _creator: req.user.id,
    status: { $ne: 'approved' }
  })
    .then(expense => {
      if (!expense) {
        return res.status(404).send()
      }
      res.status(200).send({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
