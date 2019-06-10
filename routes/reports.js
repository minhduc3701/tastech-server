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
        startDate: { $first: '$startDate' },
        endDate: { $first: '$endDate' },
        budgetPassengers: { $first: '$budgetPassengers' },
        currency: { $first: '$currency' },
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
        startDate: '$startDate',
        endDate: '$endDate',
        budgetPassengers: '$budgetPassengers',
        totalExpense: '$totalExpense',
        currency: '$currency'
      }
    }
  ])
    .then(trips => {
      res.status(200).send({ trips })
    })
    .catch(e => res.status(400).send())
})

router.get('/trips/spendingsByTrip', (req, res) => {
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
        totalExpenses: '$amount'
      }
    },
    {
      $sort: {
        totalExpenses: -1 // larger amount first
      }
    }
  ])
    .then(expense => {
      return Expense.populate(expense, [
        { path: '_trip', select: ['name', 'budgetPassengers'] }
      ])
    })
    .then(trips => {
      let spendingsByTrip = trips
      res.status(200).send({
        spendingsByTrip
      })
    })
    .catch(e => res.status(400).send())
})

router.get('/trips/spendingsByTime', (req, res) => {
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
        _id: {
          $dateToString: { format: '%d-%m-%Y', date: '$transactionDate' }
        },
        amount: { $sum: '$amount' },
        transactionDate: { $first: '$transactionDate' }
      }
    },
    {
      $sort: { transactionDate: 1 }
    }
  ])
    .then(expenses => {
      let spendingsByTime = expenses
      res.status(200).send({
        spendingsByTime
      })
    })
    .catch(e => res.status(400).send())
})

router.get('/ongoingTrip', function(req, res, next) {
  Trip.findOne({
    _creator: req.user._id,
    status: 'ongoing',
    businessTrip: true
  })
    .sort({ createdAt: -1 })
    .then(trip => {
      return Promise.all([
        trip.budgetPassengers[0].totalPrice,
        Expense.aggregate([
          {
            $match: {
              _creator: req.user._id,
              _trip: { $eq: trip._id },
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
              _trip: { $eq: trip._id },
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
    ])
  ])
    .then(results => {
      let expenses = results[0]
      let categoryStatistics = results[1]

      res.status(200).send({
        expenses,
        categoryStatistics
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
