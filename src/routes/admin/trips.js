const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const Expense = require('../../models/expense')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeChangeTripStatus } = require('../../middleware/email')
const {
  createTripExpense,
  updateTripExpenseStatus
} = require('../../middleware/trips')

router.get('/', async function(req, res) {
  let perPage = _.get(req.query, 'perPage', 15)
  perPage = Math.max(15, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let keyword = _.get(req.query, 's', '')
    .trim()
    .toLowerCase()

  let status = _.get(req.query, 'status', '')
  status = status.split(',')

  let allStatus = [
    'waiting',
    'approved',
    'rejected',
    'ongoing',
    'finished',
    'completed'
  ]

  status = status.filter(s => allStatus.includes(s))
  status = _.isEmpty(status) ? allStatus : status

  let expensesSearching = _.get(req.query, 'expensesSearching', '')
  expensesSearching = expensesSearching.split(',')

  allExpenseStatus = ['empty', 'waiting', 'claiming', 'approved', 'rejected']
  expensesSearching = expensesSearching.filter(s =>
    allExpenseStatus.includes(s)
  )

  let objFind = {
    _company: req.user._company,
    businessTrip: true,
    archived: false,
    status: { $in: status }
  }

  if (keyword) {
    let objFindKeyword = {
      $regex: new RegExp(keyword),
      $options: 'i'
    }
    let users = await User.find({
      $or: [
        { email: objFindKeyword },
        { firstName: objFindKeyword },
        { lastName: objFindKeyword }
      ]
    })

    objFind.$or = [
      {
        name: objFindKeyword
      },
      {
        _creator: {
          $in: users.map(v => v._id)
        }
      }
    ]
  }
  if (!_.isEmpty(expensesSearching)) {
    objFind.expensesStatus = { $in: expensesSearching }
  } else {
    objFind.isBudgetUpdated = true
  }

  const queryAggregate = [
    {
      $match: { ...objFind }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_creator',
        foreignField: '_id',
        as: '_creator'
      }
    },
    { $unwind: '$_creator' },
    {
      $lookup: {
        from: 'departments',
        localField: '_creator._department',
        foreignField: '_id',
        as: '_creator._department'
      }
    },
    { $unwind: '$_creator._department' },
    {
      $match: {
        '_creator._department._approver': req.user._id
      }
    }
  ]

  const queryAggregateList = [
    ...queryAggregate,
    { $sort: { updatedAt: -1 } },
    { $skip: perPage * page },
    { $limit: perPage }
  ]
  const queryAggregateCount = [
    ...queryAggregate,
    {
      $group: { _id: null, total: { $sum: 1 } }
    }
  ]

  Promise.all([
    Trip.aggregate(queryAggregateList),
    Trip.aggregate(queryAggregateCount)
  ])
    .then(results => {
      return Promise.all([
        ...results,
        Expense.find({
          _trip: { $in: results[0].map(trip => trip._id) }
        })
      ])
    })
    .then(results => {
      let trips = results[0]
      let total = results[1][0].total
      let expenses = results[2]

      trips = trips
        .filter(trip => trip._creator)
        .map(trip => {
          let expensesInTrip = expenses.filter(
            e => e._trip.toHexString() === trip._id.toHexString()
          )
          return {
            ...trip,
            totalExpense: expensesInTrip.reduce((acc, e) => acc + e.amount, 0)
          }
        })

      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: trips.length,
        perPage,
        trips
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Trip.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('_creator')
    .populate('_trip')
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

router.patch(
  '/:id',
  (req, res, next) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    const body = _.pick(req.body, [
      'status',
      'budgetPassengers',
      'adminMessage',
      'updatedByAdmin',
      'updatedByAdminAt',
      'isBookedWithinBudget',
      'isBookedWithinPolicy'
    ])
    Trip.findOneAndUpdate(
      {
        _id: id,
        _company: req.user._company,
        archived: false
      },
      { $set: body },
      { new: true }
    )
      .then(trip => {
        req.trip = trip
        if (!trip) {
          return res.status(404).send()
        }
        res.status(200).send({ trip })
        req.tripIds = [trip._id] // save for middleware updateTripExpenseStatus
        next()
      })
      .catch(e => {
        res.status(400).send()
      })
  },
  createTripExpense,
  updateTripExpenseStatus,
  emailEmployeeChangeTripStatus
)

// get expenses by trip id
router.get('/:id/expenses', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Trip.findOne({
    _id: id,
    _company: req.user._company
  })
    .populate('_creator')
    .populate('_trip')
    .then(trip => {
      if (!trip) {
        return res.status(404).send()
      }
      return Promise.all([
        trip,
        Expense.find({
          _trip: id
        })
          .sort({ updatedAt: -1 })
          .limit(100)
      ])
    })
    .then(results => {
      let trip = results[0]
      let expenses = results[1]
      res.status(200).send({ trip, expenses })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
