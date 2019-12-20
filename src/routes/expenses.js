const express = require('express')
const router = express.Router()
const Expense = require('../models/expense')
const Trip = require('../models/trip')
const { ObjectID } = require('mongodb')
const { upload } = require('../config/aws')
const _ = require('lodash')
const { validateExpenseProps } = require('../middleware/expense')
const { currentCompany } = require('../middleware/company')
const {
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense
} = require('../middleware/email')

router.post(
  '/',
  currentCompany,
  upload.array('receipts'),
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
        return res.status(200).json({ expense })
      })
    } catch (error) {
      return res.status(400).send()
    }
  }
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

router.patch('/:id', upload.array('receipts'), validateExpenseProps, function(
  req,
  res,
  next
) {
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

router.patch(
  '/',
  function(req, res, next) {
    let { expenseIds } = req.body
    // save for sending email
    req.expenseIds = expenseIds
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
      next()
    } catch (error) {
      res.status(400).send()
    }
  },
  emailEmployeeClaimExpense,
  emailAccountantClaimExpense
)

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
