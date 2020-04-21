const User = require('../models/user')
const Trip = require('../models/trip')
const Airline = require('../models/airline')
const Airport = require('../models/airport')
const Company = require('../models/company')
const Expense = require('../models/expense')
const { fileUpload } = require('../config/aws')
const upload = fileUpload('receipts')
const multiUpload = upload.array('receipts')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { createPdf } = require('../modules/pdf')
const fs = require('fs')
const path = require('path')
const moment = require('moment')

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

const replaceAll = (str, obj) => {
  Object.keys(obj).forEach(key => {
    str = str.replace(new RegExp(`{{${key}}}`, 'g'), obj[key])
  })
  return str
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

    let company = await Company.findOne({
      _id: req.user._company
    })

    if (_.get(req, 'flightOrder.status', '') === 'processing') {
      let flightPdfTemplate = fs.readFileSync(
        `${__dirname}/../pdfTemplate/flightReceipt.html`,
        'utf8'
      )

      let bookedAirlines = []
      let bookedAirports = []

      let dSegments = _.get(req, 'flightOrder.flight.departureSegments', [])

      if (!_.isEmpty(dSegments)) {
        dSegments.forEach(s => {
          bookedAirlines.push(s.airline)
        })

        bookedAirports = _.uniq([
          _.first(dSegments).departure,
          _.last(dSegments).arrival
        ])
      }

      let rSegments = _.get(req, 'flightOrder.flight.returnSegments', [])
      if (!_.isEmpty(rSegments)) {
        rSegments.forEach(s => {
          bookedAirlines.push(s.airline)
        })
      }

      bookedAirlines = _.uniq(bookedAirlines)

      let airlines = await Airline.find({
        iata: { $in: bookedAirlines }
      })

      let airlineNames = {}
      airlines.forEach(a => {
        airlineNames[a._doc.iata] = a._doc.name
      })

      let airports = await Airport.find({
        airport_code: { $in: bookedAirports }
      })
      let cityNames = {}
      airports.forEach(a => {
        cityNames[a._doc.airport_code] = a._doc.city_name
      })

      let price = req.flightOrder.currency + ' ' + req.flightOrder.totalPrice

      let routine =
        cityNames[_.first(dSegments).departure] +
        ' - ' +
        cityNames[_.last(dSegments).arrival] +
        ' (' +
        (_.isEmpty(rSegments) ? '' : 'Round trip: ') +
        moment(_.first(dSegments).departureDate).format('DD MMM YYYY') +
        ' - ' +
        (_.isEmpty(rSegments)
          ? moment(_.last(dSegments).arrivalDate).format('DD MMM YYYY')
          : moment(_.last(rSegments).arrivalDate).format('DD MMM YYYY')) +
        ')'

      let airlinesDetail = ''
      if (!_.isEmpty(dSegments)) {
        airlinesDetail += '<tr><td>Departure:</td><td><table><tbody>'

        dSegments.forEach(s => {
          airlinesDetail +=
            '<tr><td>' +
            airlineNames[s.airline] +
            '</td><td>' +
            s.departure +
            ' - ' +
            s.arrival +
            '</td></tr>'
        })

        airlinesDetail += '</tbody></table></td><td>' + price + '</td></tr>'
      }

      if (!_.isEmpty(rSegments)) {
        airlinesDetail += '<tr><td>Return:</td><td><table><tbody>'

        rSegments.forEach(s => {
          airlinesDetail +=
            '<tr><td>' +
            airlineNames[s.airline] +
            '</td><td>' +
            s.departure +
            ' - ' +
            s.arrival +
            '</td></tr>'
        })

        airlinesDetail +=
          '</tbody></table></td><td>' +
          req.flightOrder.currency +
          ' 0</td></tr>'
      }

      let pdfData = {
        logo: path.join('file://', `${__dirname}/../pdfTemplate/`, 'logo.svg'),
        orderId: _.get(req, 'flightOrder._id', ''),
        customerName: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email,
        company: company.name,
        bookingDate: moment(req.flightOrder.createAt).format('DD MMM YYYY'),
        paymentMethod: 'Credit card',
        routine,
        airlinesDetail,
        price,
        bookingFee: 'FREE',
        totalCost: price,
        generatedDate: moment().format('DD MMM YYYY, HH:mm:ss')
      }

      flightPdfTemplate = replaceAll(flightPdfTemplate, pdfData)

      const flightPdf = await createPdf(flightPdfTemplate)
      flightExpenseData = {
        ...commonExpenseData,
        name: 'Flight expense for ' + trip.name,
        category: 'flight',
        currency: req.flightOrder.currency,
        rawCurrency: req.flightOrder.currency,
        amount: req.flightOrder.totalPrice,
        rawAmount: req.flightOrder.totalPrice,
        receipts: [flightPdf.pdfName],
        _order: req.flightOrder._id
      }
      const flightExpense = new Expense(flightExpenseData)
      await flightExpense.save()
    }

    if (_.get(req, 'hotelOrder.status', '') === 'completed') {
      let hotelPdfTemplate = fs.readFileSync(
        `${__dirname}/../pdfTemplate/hotelReceipt.html`,
        'utf8'
      )

      let price = req.hotelOrder.currency + ' ' + req.hotelOrder.totalPrice

      let hotelName =
        '<strong>' +
        _.get(req, 'hotelOrder.hotel.name') +
        '</strong><br/>(' +
        moment(_.get(req, 'hotelOrder.hotel.checkInDate')).format(
          'DD MMM YYYY'
        ) +
        ' - ' +
        moment(_.get(req, 'hotelOrder.hotel.checkOutDate')).format(
          'DD MMM YYYY'
        ) +
        ')'

      let roomName = _.get(req, 'hotelOrder.hotel.roomName')

      let pdfData = {
        logo: path.join('file://', `${__dirname}/../pdfTemplate/`, 'logo.svg'),
        orderId: _.get(req, 'hotelOrder._id', ''),
        customerName: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email,
        company: company.name,
        bookingDate: moment(req.hotelOrder.createAt).format('DD MMM YYYY'),
        paymentMethod: 'Credit card',
        hotelName,
        roomName,
        price,
        bookingFee: 'FREE',
        totalCost: price,
        generatedDate: moment().format('DD MMM YYYY, HH:mm:ss')
      }

      hotelPdfTemplate = replaceAll(hotelPdfTemplate, pdfData)

      const hotelPdf = await createPdf(hotelPdfTemplate)

      hotelExpenseData = {
        ...commonExpenseData,
        name: 'Hotel expense for ' + trip.name,
        category: 'lodging',
        currency: req.hotelOrder.currency,
        rawCurrency: req.hotelOrder.currency,
        amount: req.hotelOrder.totalPrice,
        rawAmount: req.hotelOrder.totalPrice,
        receipts: [hotelPdf.pdfName],
        _order: req.hotelOrder._id
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
