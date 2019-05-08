const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
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
    Trip.count({
      _company: req.user._company
    }),
    // total travel employees
    Trip.count({
      _company: req.user._company
    })
  ])
    .then(results => {
      let totalBudgetResults = results[0]
      let totalTrips = results[1]
      let totalTravelEmployees = results[2]

      let totalBudget = totalBudgetResults[0].totalBudget

      res.status(200).send({
        totalBudget,
        totalTrips,
        totalTravelEmployees
      })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
