const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', (req, res) => {
  Promise.all([
    // total budget
    Trip.aggregate([
      {
        $match: {
          _creator: req.user._id,
          _company: req.user._company
        }
      },
      {
        $unwind: '$budgetPassengers'
      },
      {
        $group: {
          _id: '',
          totalBudget: { $sum: '$budgetPassengers.totalPrice' }
        }
      },
      {
        $project: {
          _id: 0,
          totalBudget: '$totalBudget'
        }
      }
    ]),
    // total trip
    Trip.countDocuments({
      _creator: req.user._id,
      _company: req.user._company
    }),
    // approved spending by trip
    Expense.aggregate([
      {
        $match: {
          _company: req.user._company,
          _creator: req.user._id,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$_trip',
          _trip: { $first: '$_trip' },
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          _trip: '$_trip',
          amount: '$amount'
        }
      },
      {
        $sort: {
          amount: -1 // larger amount first
        }
      }
    ]),
    // total approved spending
    Expense.aggregate([
      {
        $match: {
          _company: req.user._company,
          _creator: req.user._id,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '',
          totalSpending: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSpending: '$totalSpending'
        }
      }
    ])
  ])
    .then(results => {
      return Promise.all([
        results[0],
        results[1],
        Expense.populate(results[2], [{ path: '_trip', select: 'name' }]),
        results[3]
      ])
    })
    .then(results => {
      let totalBudgetResults = results[0]
      let totalTrips = results[1]
      let spendingByTrips = results[2]
      let totalSpendingResults = results[3]
      let totalBudget = totalBudgetResults[0].totalBudget
      let totalSpending = totalSpendingResults[0].totalSpending

      res.status(200).send({
        totalBudget,
        totalSpending,
        totalTrips,
        spendingByTrips
      })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Promise.all([
    // expenses belong to the trip id
    Expense.find({
      _company: req.user._company,
      _trip: id,
      status: 'approved'
    }).populate('_trip'),
    // trip statistic by category
    Expense.aggregate([
      {
        $match: {
          _trip: new ObjectID(id),
          _company: req.user._company,
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
      },
      {
        $sort: {
          amount: -1 // larger amount first
        }
      }
    ])
  ])
    .then(results => {
      let expenses = results[0]
      let statistics = results[1]

      res.status(200).send({
        expenses,
        statistics
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
