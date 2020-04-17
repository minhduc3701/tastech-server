const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { roundingAmountStripe } = require('../modules/utils')
const { orderCancelled } = require('../mailTemplates/orderCancelled')
const Order = require('../models/order')
const Company = require('../models/company')
const Expense = require('../models/expense')
const User = require('../models/user')
const Trip = require('../models/trip')
const { mail } = require('../config/mail')
const _ = require('lodash')
const { createPdf } = require('../modules/pdf')
const moment = require('moment')
const fs = require('fs')
const path = require('path')

// Run after PATCH /tas-admin/orders/:id
const refundCancelledOrderManually = async (req, res, next) => {
  if (
    !req.cancelledOrder ||
    _.get(req, 'cancelledOrder.chargeInfo.source.object', '') !== 'card'
  ) {
    return next()
  }

  let order = req.cancelledOrder
  let cancelCharge = Math.max(req.cancelCharge, 0)
  let refundAmount = 0

  if (cancelCharge > order.totalPrice) {
    cancelCharge = order.totalPrice
  }

  refundAmount = order.totalPrice - cancelCharge
  refundAmount = roundingAmountStripe(refundAmount, order.currency)

  // capture first, run even this charge is captured or not
  // to guarantee any refunds whole or part will be ok
  try {
    if (refundAmount < order.chargeInfo.amount) {
      await stripe.charges.capture(order.chargeId)
    }
  } catch (e) {
    // do nothing even error or not, just a confirm step
  }

  try {
    if (refundAmount > 0) {
      await stripe.refunds.create({
        charge: order.chargeId,
        amount: refundAmount
      })
    }

    order.cancelCharge = cancelCharge
    order.rawCancelCharge =
      cancelCharge / (order.totalPrice / order.rawTotalPrice)

    await order.save()
  } catch (e) {}

  next()
}

const refundCancelledOrderDepositManually = async (req, res, next) => {
  if (
    !req.cancelledOrder ||
    _.get(req, 'cancelledOrder.chargeInfo.paymentType', '') !== 'deposit'
  ) {
    return next()
  }

  let order = req.cancelledOrder
  let cancelCharge = Math.max(req.cancelCharge, 0)
  let refundAmount = 0

  if (cancelCharge > order.totalPrice) {
    cancelCharge = order.totalPrice
  }

  refundAmount = order.totalPrice - cancelCharge

  try {
    if (refundAmount > 0) {
      let note = 'refund for orders:' + _.get(order, '_id', '')
      let company = await Company.findById(order._company)

      let {
        deposit,
        isCreditLimitation,
        creditLimitationAmount,
        remainingCredit
      } = company

      let newDeposit = company.deposit
      let newRemainingCredit = company.remainingCredit
      remainingCredit = isCreditLimitation ? remainingCredit : 0
      let newLogs = []

      if (!isCreditLimitation) {
        newDeposit += refundAmount
      } else {
        if (creditLimitationAmount - company.remainingCredit >= refundAmount) {
          newRemainingCredit += refundAmount
        } else {
          newRemainingCredit = creditLimitationAmount
          newDeposit +=
            refundAmount - (creditLimitationAmount - remainingCredit)
        }

        if (newRemainingCredit !== remainingCredit) {
          newLogs.push({
            _creator: req.user._id,
            createdAt: new Date(),
            field: 'remainingCredit',
            old: remainingCredit,
            new: newRemainingCredit,
            note
          })
        }
      }

      if (newDeposit !== deposit) {
        newLogs.push({
          _creator: req.user._id,
          createdAt: new Date(),
          field: 'deposit',
          old: deposit,
          new: newDeposit,
          note
        })
      }

      let updatedData = {
        deposit: newDeposit,
        remainingCredit: newRemainingCredit
      }

      await Company.findOneAndUpdate(
        {
          _id: company._id,
          _partner: req.user._partner
        },
        {
          $set: updatedData,
          $push: { logs: newLogs }
        },
        { new: true }
      )
    }

    order.cancelCharge = cancelCharge
    order.rawCancelCharge =
      cancelCharge / (order.totalPrice / order.rawTotalPrice)

    await order.save()
  } catch (e) {}

  next()
}

// required
//   req.cancelledOrder
const emailCustomerCancelledOrder = async (req, res, next) => {
  if (!req.cancelledOrder) {
    return next()
  }

  let order = await Order.populate(req.cancelledOrder, { path: '_customer' })
  let refundAmount = order.totalPrice - order.cancelCharge

  let mailOptions = await orderCancelled(
    req.headers.origin,
    order,
    refundAmount
  )
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      // debugMail(err)
      // logger.error('mail: ', { err: err })
    }
  })
}

const replaceAll = (str, obj) => {
  Object.keys(obj).forEach(key => {
    str = str.replace(new RegExp(`{{${key}}}`, 'g'), obj[key])
  })
  return str
}

const remakeExpenseCanceledOrder = async (req, res, next) => {
  try {
    if (req.cancelledOrder && req.cancelledOrder.status === 'cancelled') {
      const {
        _id,
        rawCancelCharge,
        cancelCharge,
        rawCurrency,
        currency,
        _trip,
        _company,
        type,
        _customer,
        flight
      } = req.cancelledOrder
      await Expense.deleteMany({ _order: _id })

      if (cancelCharge > 0) {
        let customer = await User.findById(_customer)
        let company = await Company.findById(_company)
        let trip = await Trip.findById(_trip)

        let flightPdfTemplate = fs.readFileSync(
          `${__dirname}/../pdfTemplate/canceledReceipt.html`,
          'utf8'
        )

        let airlinesDetail = ''

        if (type === 'flight') {
          airlinesDetail = `
          <tr>
            <td colspan="3">
              ${_.get(
                trip,
                'budgetPassengers[0].flight.departDestinationCode',
                ''
              ) +
                ' - ' +
                _.get(
                  trip,
                  'budgetPassengers[0].flight.returnDestinationCode',
                  ''
                ) +
                ' (' +
                (_.get(trip, 'budgetPassengers[0].flight.flightType', '') ===
                'round-trip'
                  ? 'Round trip: '
                  : 'One way: ') +
                moment(
                  _.get(trip, 'budgetPassengers[0].flight.departDate', moment())
                ).format('MMM DD, YYYY') +
                ' - ' +
                moment(
                  _.get(trip, 'budgetPassengers[0].flight.returnDate', moment())
                ).format('MMM DD, YYYY') +
                ')'}
            </td>
          </tr>
          <tr>
            <td>
              <p>Departure:</p>
            </td>
            <td>
              ${[...flight.departureSegments]
                .map(({ airline, departure, arrival }) => {
                  return `<p>${airline} Airline: ${departure} - ${arrival}  </p>`
                })
                .join('')}
            <td>
          </tr>
          <tr>
            <td>
              <p>Return:</p>
            </td>
            <td>
              ${[...flight.returnSegments]
                .map(({ airline, departure, arrival }) => {
                  return `<p>${airline} Airline: ${departure} - ${arrival}  </p>`
                })
                .join('')}
            <td>
          </tr>
        `
        } else if (type === 'hotel') {
          airlinesDetail = `
          <tr>
            <td colspan="3">
              ${_.get(trip, 'budgetPassengers[0].lodging.regionName', '') +
                ' (' +
                moment(
                  _.get(
                    trip,
                    'budgetPassengers[0].lodging.checkInDate',
                    moment()
                  )
                ).format('MMM DD, YYYY') +
                ' - ' +
                moment(
                  _.get(
                    trip,
                    'budgetPassengers[0].lodging.checkOutDate',
                    moment()
                  )
                ).format('MMM DD, YYYY') +
                ')'}
            </td>
          </tr>
          `
        }

        let pdfData = {
          airlinesDetail,
          logo: path.join(
            'file://',
            `${__dirname}/../pdfTemplate/`,
            'logo.svg'
          ),
          orderId: _id,
          customerName: customer.firstName + ' ' + customer.lastName,
          email: customer.email,
          company: company.name,
          orderId: _id,
          invoiceNumber: `#${12345678}`,
          cancellationFeeForBooking: `$ ${cancelCharge} ${currency}`,
          totalCost: `$ ${cancelCharge} ${currency}`,
          generatedDate: moment().format('DD MMM YYYY, HH:mm:ss')
        }

        flightPdfTemplate = replaceAll(flightPdfTemplate, pdfData)
        const flightPdf = await createPdf(flightPdfTemplate)

        let refundExpenseData = {
          _trip,
          _company,
          currency,
          rawCurrency,
          _order: _id,
          _creator: _customer,
          amount: cancelCharge,
          rawAmount: rawCancelCharge,
          receipts: [flightPdf.pdfName],
          name: 'Cancellation fee for Booking #12334879',
          category: type === 'flight' ? 'flight' : 'lodging',
          message: `${type} cancel fee`,
          adminMessage: `${type} cancel fee`,
          transactionDate: new Date(),
          city: '',
          _attendees: [],
          claimed: false,
          status: 'waiting',
          vendor: 'EzBizTrip',
          account: 'credit-card'
        }
        const newExpense = new Expense(refundExpenseData)
        await newExpense.save()
      }
    }
    next()
  } catch (error) {
    next()
  }
}

module.exports = {
  refundCancelledOrderManually,
  refundCancelledOrderDepositManually,
  emailCustomerCancelledOrder,
  remakeExpenseCanceledOrder
}
