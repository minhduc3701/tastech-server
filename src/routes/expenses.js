const express = require('express')
const router = express.Router()
const Expense = require('../models/expense')
const Trip = require('../models/trip')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const {
  validateExpenseProps,
  uploadReceipts
} = require('../middleware/expense')
const { updateTripExpenseStatus } = require('../middleware/trips')
const { currentCompany } = require('../middleware/company')
const {
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense
} = require('../middleware/email')

router.post(
  '/',
  currentCompany,
  uploadReceipts,
  validateExpenseProps,
  function(req, res, next) {
    try {
      const expense = new Expense(req.body)
      expense._creator = req.user._id
      expense._company = req.user._company
      expense.currency = req.company.currency
      if (!_.isEmpty(req.files)) {
        expense.receipts = req.files.map(file => file.key)
      }
      if (!_.isEmpty(req.body._attendees)) {
        expense._attendees = req.body._attendees.split(',')
      } else {
        expense._attendees = []
      }
      expense.save().then(() => {
        res.status(200).json({ expense })
        // save for middleware
        req.tripIds = [expense._trip]
        next()
      })
    } catch (error) {
      return res.status(400).send()
    }
  },
  updateTripExpenseStatus
)

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 15)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))

  let keyword = _.get(req.query, 's', '')
    .trim()
    .toLowerCase()

  let availableTripIds = []
  Trip.find(
    {
      _creator: req.user._id,
      archived: { $ne: true }
    },
    '_id'
  )
    .then(trips => {
      availableTripIds = trips.map(trip => trip._id)
      return Promise.all([
        Expense.find({
          _creator: req.user._id,
          _trip: { $in: availableTripIds },
          name: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        })
          .sort({ updatedAt: -1 })
          .populate('_trip')
          .populate('_attendees', 'email')
          .limit(perPage)
          .skip(perPage * page),
        Expense.countDocuments({
          _creator: req.user._id,
          _trip: { $in: availableTripIds },
          name: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        })
      ])
    })
    .then(results => {
      let expenses = results[0]
      let total = results[1]

      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        perPage,
        expenses
      })
    })
    .catch(e => {
      res.status(400).send(e)
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

router.patch(
  '/:id',
  uploadReceipts,
  validateExpenseProps,
  async function(req, res, next) {
    if (!ObjectID.isValid(req.params.id)) {
      return res.status(404).send()
    }
    let body = _.pick(req.body, [
      '_attendees',
      'name',
      'amount',
      'rawAmount',
      'rawCurrency',
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
    //update status expense to waiting
    body.status = 'waiting'

    let oldExpense = await Expense.findOne({
      _id: req.params.id,
      _creator: req.user.id,
      status: {
        $in: ['waiting', 'rejected']
      }
    })

    req.tripIds = [oldExpense._trip, body._trip]
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
        next()
      })
      .catch(e => {
        res.status(400).send()
      })
  },
  updateTripExpenseStatus
)

// route for claiming expenses
router.patch(
  '/',
  function(req, res, next) {
    let { expenseIds, tripId } = req.body
    // save for sending email
    req.expenseIds = expenseIds
    try {
      Expense.updateMany(
        {
          _creator: req.user.id,
          _id: { $in: expenseIds },
          status: 'waiting'
        },
        { $set: { status: 'claiming' } },
        function(err, result) {
          if (err) return res.status(400).send()
          res.status(200).json({ expenseIds, status: 'claiming' })
          req.tripIds = [tripId] // save for middleware
          next()
        }
      )
    } catch (error) {
      res.status(400).send()
    }
  },
  updateTripExpenseStatus,
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense
)

router.delete(
  '/',
  async function(req, res, next) {
    let { expenseIds, tripId } = req.body
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
          req.tripIds = [tripId] // save for middleware
          next()
        }
      )
    } catch (error) {
      res.status(400).send(error)
    }
  },
  updateTripExpenseStatus
)

router.delete(
  '/:id',
  function(req, res, next) {
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
        // save for middleware
        req.tripIds = [expense._trip]
        next()
      })
      .catch(e => {
        res.status(400).send()
      })
  },
  updateTripExpenseStatus
)

module.exports = router
