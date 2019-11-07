const express = require('express')
const router = express.Router()
const Expense = require('../../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { emailEmployeeChangeExpenseStatus } = require('../../middleware/email')

router.get('/', function(req, res) {
  let perPage = _.get(req.query, 'perPage', 15)
  perPage = Math.max(15, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))

  let keyword = _.get(req.query, 's', '')
    .trim()
    .toLowerCase()

  let status = _.get(req.query, 'status', 'claiming,approved,rejected')
  status = status.split(',')

  let allStatus = ['claiming', 'approved', 'rejected']

  status = status.filter(s => allStatus.includes(s))
  status = _.isEmpty(status) ? allStatus : status

  Promise.all([
    Expense.find({
      _company: req.user._company,
      status: { $in: status },
      name: {
        $regex: new RegExp(keyword),
        $options: 'i'
      }
    })
      .populate({
        path: '_creator',
        populate: {
          path: '_department',
          select: 'name'
        }
      })
      .populate('_trip')
      .sort({ updatedAt: -1 })
      .limit(perPage)
      .skip(perPage * page),
    Expense.countDocuments({
      _company: req.user._company,
      status: { $in: status },
      name: {
        $regex: new RegExp(keyword),
        $options: 'i'
      }
    })
  ])
    .then(results => {
      let expenses = results[0]
      expenses = expenses
        .filter(expense => expense._creator)
        .map(expense => ({
          ...expense.toJSON(),
          _creator: expense._creator.toJSON()
        }))

      let total = results[1]

      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: expenses.length,
        perPage,
        expenses
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

  Expense.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('_creator')
    .populate('_attendees')
    .populate('_trip')
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
  '/:id',
  (req, res, next) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
      return res.status(404).send()
    }

    const body = _.pick(req.body, ['status', 'adminMessage'])

    Expense.findOneAndUpdate(
      {
        _id: id,
        _company: req.user._company
      },
      { $set: body },
      { new: true }
    )
      .then(expense => {
        if (!expense) {
          return res.status(404).send()
        }
        res.status(200).send({ expense })
        // save for sending email to employee
        req.expense = expense
        next()
      })
      .catch(e => {
        console.log(e)
        res.status(400).send()
      })
  },
  emailEmployeeChangeExpenseStatus
)

module.exports = router
