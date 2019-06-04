const express = require('express')
const router = express.Router()
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/trips', (req, res) => {
  Trip.aggregate([
    {
      $match: {
        _company: req.user._company,
        _creator: req.user._id
      }
    },
    {
      $lookup: {
        from: 'expenses',
        localField: '_id',
        foreignField: '_trip',
        as: 'expenses'
      }
    },
    {
      $unwind: '$expenses'
    },
    {
      $group: {
        _id: '$_id',
        id: { $first: '$_id' },
        name: { $first: '$name' },
        departureDate: { $first: '$departureDate' },
        returnDate: { $first: '$returnDate' },
        budgetPassengers: { $first: '$budgetPassengers' },
        totalExpense: {
          $sum: {
            $cond: {
              if: { $eq: ['$expenses.status', 'approved'] },
              then: '$expenses.amount',
              else: 0
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        name: '$name',
        id: '$_id',
        departureDate: '$departureDate',
        returnDate: '$returnDate',
        budgetPassengers: '$budgetPassengers',
        totalExpense: '$totalExpense'
      }
    }
  ])
    .then(trips => {
      res.status(200).send({ trips })
    })
    .catch(e => res.status(400).send())
})

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

router.get('/ongoingTrip', function(req, res, next) {
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
    ]),
    // trip statistic by account
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
          _id: '$account',
          account: { $first: '$account' },
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          account: '$account',
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
      let categoryStatistics = results[1]
      let accountStatistics = results[2]

      res.status(200).send({
        expenses,
        categoryStatistics,
        accountStatistics
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
