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
        Expense.populate(results[4], [{ path: '_trip', select: 'name' }])
      ])
    })
    .then(results => {
      let totalBudgetResults = results[0]
      let totalTrips = results[1]
      let totalTravelEmployees = results[2]
      let spendingByUsers = results[3]
      let spendingByTrips = results[4]
      let totalBudget = totalBudgetResults[0].totalBudget

      res.status(200).send({
        totalBudget,
        totalTrips,
        totalTravelEmployees,
        spendingByUsers,
        spendingByTrips
      })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
