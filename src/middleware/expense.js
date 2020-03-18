const User = require('../models/user')
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const { fileUpload } = require('../config/aws')
const upload = fileUpload('receipts')
const multiUpload = upload.array('receipts')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { createPdf } = require('../modules/pdf')

const validateExpenseProps = async (req, res, next) => {
  try {
    // validate trip, trip belongs to user and has valid status
    let trip = await Trip.findOne({
      _id: req.body._trip,
      _company: req.user._company,
      _creator: req.user._id
    })
    if (!trip || !['approved', 'ongoing', 'finished'].includes(trip.status)) {
      return res.status(400).send()
    }

    // validate attendees
    let attendees = req.body._attendees
    if (!_.isEmpty(attendees)) {
      attendees = req.body._attendees.split(',')
      // check each element in attendees is valid ObjectID
      if (
        attendees.filter(attendee => ObjectID.isValid(attendee)).length ===
        attendees.length
      ) {
        let users = await User.find({
          _id: { $in: attendees },
          _company: req.user._company
        })
        if (users.length !== attendees.length) {
          return res.status(400).send()
        }
        // ok at aall, return next()
      } else {
        return res.status(400).send()
      }
    }
    return next()
  } catch (error) {
    return res.status(400).send()
  }
}

const makeExpensesAfterCheckout = async (req, res, next) => {
  try {
    let trip = await Trip.findOne({
      _id: req.trip._id
    })

    // if not business Trip, bypass
    if (!trip.businessTrip) {
      return next()
    }

    // if business trip, make a new expense
    let commonExpenseData = {
      _creator: req.user._id,
      _company: req.user._company,
      _trip: trip._id,
      claimed: false,
      status: 'waiting',
      vendor: 'EzBizTrip',
      city: '',
      message: '',
      account: 'credit-card',
      transactionDate: new Date(),
      _attendees: []
    }

    if (_.get(req, 'flightOrder.status', '') === 'processing') {
      const flightPdf = await createPdf(`<h1>Flight ${trip.name}</h1>`)
      flightExpenseData = {
        ...commonExpenseData,
        name: 'Flight expense for ' + trip.name,
        category: 'flight',
        currency: req.flightOrder.currency,
        rawCurrency: req.flightOrder.currency,
        amount: req.flightOrder.totalPrice,
        rawAmount: req.flightOrder.totalPrice,
        receipts: [flightPdf.pdfName]
      }
      const flightExpense = new Expense(flightExpenseData)
      await flightExpense.save()
    }

    if (_.get(req, 'hotelOrder.status', '') === 'completed') {
      const hotelPdf = await createPdf(`<h1>Hotel ${trip.name}</h1>`)

      hotelExpenseData = {
        ...commonExpenseData,
        name: 'Hotel expense for ' + trip.name,
        category: 'lodging',
        currency: req.hotelOrder.currency,
        rawCurrency: req.hotelOrder.currency,
        amount: req.hotelOrder.totalPrice,
        rawAmount: req.hotelOrder.totalPrice,
        receipts: [hotelPdf.pdfName]
      }
      const hotelExpense = new Expense(hotelExpenseData)
      await hotelExpense.save()
    }
  } catch (error) {}
  return next()
}

const uploadReceipts = function(req, res, next) {
  multiUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        code: err.code
      })
    }
    next()
  })
}
module.exports = {
  validateExpenseProps,
  makeExpensesAfterCheckout,
  uploadReceipts
}
