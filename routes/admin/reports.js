const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const Expense = require('../../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', (req, res) => {
  Promise.all([
    // total budget
    Trip.aggregate([
      {
        $match: {
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
      _company: req.user._company
    }),
    // total travel employees
    Trip.countDocuments({
      _company: req.user._company
    }),
    // approved spending by user
    Expense.aggregate([
      {
        $match: {
          _company: req.user._company,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$_creator',
          _creator: { $first: '$_creator' },
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          _creator: '$_creator',
          amount: '$amount'
        }
      },
      {
        $sort: {
          amount: -1 // larger amount first
        }
      }
    ]),
    // approved spending by trip
    Expense.aggregate([
      {
        $match: {
          _company: req.user._company,
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
        results[2],
        Expense.populate(results[3], [
          { path: '_creator', select: 'firstName lastName' }
        ]),
        Expense.populate(results[4], [{ path: '_trip', select: 'name' }]),
        results[5]
      ])
    })
    .then(results => {
      let totalBudgetResults = results[0]
      let totalTrips = results[1]
      let totalTravelEmployees = results[2]
      let spendingByUsers = results[3]
      let spendingByTrips = results[4]
      let totalSpendingResults = results[5]
      let totalBudget = totalBudgetResults[0].totalBudget
      let totalSpending = totalSpendingResults[0].totalSpending

      res.status(200).send({
        totalBudget,
        totalSpending,
        totalTrips,
        totalTravelEmployees,
        spendingByUsers,
        spendingByTrips
      })
    })
    .catch(e => res.status(400).send())
})

router.get('/trips/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Expense.aggregate([
    {
      $match: {
        _trip: id,
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
    .then(results => {
      res.status(200).send(results)
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
