const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const Expense = require('../../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

let projectUsersFields = {
  'user.hash': 0,
  'user.salt': 0,
  'user.username': 0,
  'user.avatar': 0,
  'user._company': 0,
  'user._policy': 0,
  'user._role': 0,
  'user.lastLoginDate': 0,
  'user.__v': 0
}

router.get('/trips', (req, res) => {
  Trip.aggregate([
    {
      $match: {
        _company: req.user._company,
        businessTrip: true
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
        _creator: { $first: '$_creator' },
        startDate: { $first: '$startDate' },
        endDate: { $first: '$endDate' },
        currency: { $first: '$currency' },
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
        _creator: '$_creator',
        startDate: '$startDate',
        endDate: '$endDate',
        currency: '$currency',
        budgetPassengers: '$budgetPassengers',
        totalExpense: '$totalExpense'
      }
    }
  ])
    .then(trips => {
      return Trip.populate(trips, [
        {
          path: '_creator',
          select: 'firstName lastName',
          populate: {
            path: '_department',
            select: 'name'
          }
        }
      ])
    })
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
          _company: req.user._company,
          businessTrip: true
        }
      },
      {
        $unwind: '$budgetPassengers'
      },
      {
        $group: {
          _id: '',
          currency: { $first: '$currency' },
          totalBudget: { $sum: '$budgetPassengers.totalPrice' }
        }
      },
      {
        $project: {
          _id: 0,
          currency: '$currency',
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
      let totalBudget = _.get(totalBudgetResults, '[0].totalBudget', 0)
      let totalSpending = _.get(totalSpendingResults, '[0].totalSpending', 0)
      let currency = _.get(totalBudgetResults, '[0].currency')

      res.status(200).send({
        totalBudget,
        totalSpending,
        totalTrips,
        totalTravelEmployees,
        spendingByUsers,
        spendingByTrips,
        currency
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/trips/:id', (req, res) => {
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
    })
      .populate('_trip')
      .populate('_attendees', 'username'),
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
