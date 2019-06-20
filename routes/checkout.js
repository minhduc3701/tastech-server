const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const Trip = require('../models/trip')
const Order = require('../models/order')
const api = require('../modules/api')
const { makeSegmentsData, makeRoomGuestDetails } = require('../modules/utils')
const moment = require('moment')
const _ = require('lodash')
const { removeSpaces } = require('../modules/utils')
const { USD, VND, SGD } = require('../config/currency')
const { currencyExchange } = require('../middleware/currency')

router.post('/card', async (req, res, next) => {
  const { card, trip, checkoutAgain, orderId } = req.body
  let cardId = card.id
  let foundTrip, flightOrder, hotelOrder, bookingResponse
  let { contactInfo } = trip

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  try {
    if (trip._id) {
      // checkout trip had failed orders
      if (checkoutAgain) {
        foundTrip = await Trip.findOne({
          _creator: req.user._id,
          _id: trip._id
        })

        // update existing trip
      } else {
        foundTrip = await Trip.findOneAndUpdate(
          {
            _creator: req.user._id,
            _id: trip._id,
            businessTrip: true,
            $or: [{ status: 'approved' }, { status: 'ongoing' }]
          },
          {
            $set: {
              ..._.omit(trip, ['_id', 'startDate', 'endDate']),
              status: 'ongoing'
            }
          },
          {
            new: true
          }
        )
      } // end inner if

      if (!foundTrip) {
        throw { message: 'Trip not found' }
      }

      // create new trip
    } else {
      foundTrip = new Trip({
        ...trip,
        _creator: req.user._id
      })
      await foundTrip.save()
      trip._id = foundTrip._id
    } // end outer if

    // flight order
    if (trip.flight) {
      if (checkoutAgain) {
        // find the order the assign trip.flight = flightOrder.flight
        flightOrder = await Order.findOne({
          _id: orderId,
          type: 'flight',
          _trip: trip._id,
          _customer: req.user._id,
          status: 'failed'
        })

        if (!flightOrder) {
          throw { message: 'Order not found' }
        }

        // not checkout again, create new order
      } else {
        flightOrder = new Order({
          currency: trip.flight.currency,
          rawCurrency: trip.flight.rawCurrency,
          totalPrice: trip.flight.totalPrice,
          rawTotalPrice: trip.flight.rawTotalPrice,
          type: 'flight',
          _trip: trip._id,
          flight: trip.flight,
          _customer: req.user._id,
          passengers: trip.passengers,
          contactInfo: trip.contactInfo
        })

        await flightOrder.save()
      }
    }

    // hotel order
    if (trip.hotel) {
      if (checkoutAgain) {
        // find the order the assign trip.hotel = hotelOrder.hotel
        hotelOrder = await Order.findOne({
          _id: orderId,
          type: 'hotel',
          _trip: trip._id,
          _customer: req.user._id,
          status: 'failed'
        })

        if (!hotelOrder) {
          throw { message: 'Order not found' }
        }
      } else {
        hotelOrder = new Order({
          currency: trip.hotel.currency,
          rawCurrency: trip.hotel.rawCurrency,
          totalPrice: trip.hotel.totalPrice,
          rawTotalPrice: trip.hotel.rawTotalPrice,
          type: 'hotel',
          _trip: trip._id,
          hotel: trip.hotel,
          _customer: req.user._id,
          passengers: trip.passengers,
          contactInfo: trip.contactInfo
        })
      }

      await hotelOrder.save()
    }

    // booking
    if (trip.flight) {
      let journeys = {
        journey_0: trip.flight.departureSegments.map(makeSegmentsData)
      }

      if (trip.roundTrip) {
        journeys.journey_1 = trip.flight.returnSegments.map(makeSegmentsData)
      }

      let data = {
        passengers: trip.passengers.map(passenger => ({
          birthday: moment(passenger.dateOfBirth).format('YYYY-MM-DD'),
          cardExpiredDate: moment(passenger.passportExpiryDate).format(
            'YYYY-MM-DD'
          ),
          cardNum: passenger.passportNo,
          cardType: 'P',
          firstName: removeSpaces(passenger.firstName),
          lastName: removeSpaces(passenger.lastName),
          nationality: passenger.nationality,
          psgType: 'ADT',
          sex: passenger.title === 'mr' ? 'M' : 'F'
        })),
        solution: {
          adtFare: 0,
          adtTax: 0,
          infFare: 0,
          infTax: 0,
          journeys
        }
      }

      bookingResponse = await api.preciseBooking(data)

      if (bookingResponse.data.errorCode !== '0') {
        throw {
          ...bookingResponse.data,
          message: bookingResponse.data.errorMsg,
          flight: true
        }
      }
    } // end trip.flight

    // START CHARGING =======

    // calculate the trip price here
    let currency = ''

    let amount = 0

    // if have flight
    if (flightOrder && flightOrder.flight) {
      amount += flightOrder.flight.totalPrice

      currency = flightOrder.flight.currency
    } // end flight

    // if have hotel
    if (hotelOrder && hotelOrder.hotel) {
      amount += hotelOrder.hotel.totalPrice

      currency = hotelOrder.hotel.currency
    }

    switch (currency) {
      case USD:
      case SGD:
        amount = Math.floor(amount * 100)
        break

      case VND:
        amount = Math.floor(amount)
        break
    }

    // find the card
    let foundCard = await Card.findOne({
      _id: cardId,
      owner: req.user._id
    })

    if (!foundCard) {
      throw { message: 'Cannot find card' }
    }

    // charge the customer
    const charge = await stripe.charges.create({
      amount,
      currency,
      customer: foundCard.customer.id // Previously stored, then retrieved
    })

    // AFTER CHARGING =======

    // update data for trip
    let flightUpdateData = {}
    let hotelUpdateData = {}

    // ticketing
    if (trip.flight) {
      let { pnr, orderNum } = bookingResponse.data.data

      let ticketingRes = await api.ticketing({
        email: contactInfo.email,
        name: removeSpaces(contactInfo.name),
        orderNum,
        PNR: pnr,
        telNum: `+${contactInfo.callingCode} ${contactInfo.phone}`
      })

      flightUpdateData = {
        customerCode: pnr,
        number: orderNum
      }
    } // end trip.flight

    // create hotel order
    if (trip.hotel) {
      // https://www.drzon.net/posts/generate-random-order-number/
      const orderid = require('order-id')(process.env.PKFARE_HOTEL_ORDER_SECRET)
      const customerOrderCode = orderid.generate()

      let request = {
        checkInDate: trip.hotel.checkInDate,
        checkOutDate: trip.hotel.checkOutDate,
        contactEmail: contactInfo.email,
        contactName: removeSpaces(contactInfo.name),
        contactTel: `+${contactInfo.callingCode} ${contactInfo.phone}`,
        customerOrderCode,
        numberOfAdult: trip.hotel.numberOfAdult,
        numberOfRoom: trip.hotel.numberOfRoom,
        hotelId: trip.hotel.hotelId,
        ratePlanCode: trip.hotel.ratePlanCode,
        bedTypeCode: trip.hotel.selectedBedTypeId,
        roomGuestDetails: makeRoomGuestDetails(
          trip.passengers,
          trip.hotel.numberOfRoom
        ),
        totalPrice: trip.hotel.rawTotalPrice,
        nationality: '',
        languageCode: 'en_US'
      }

      let res = await api.createHotelOrder(request)
      let orderData = res.data

      if (orderData.header.code !== 'S00000') {
        throw {
          message: `${orderData.header.message} / ${_.toString(
            orderData.header.warning
          )}`,
          hotel: true
        }
      }

      hotelUpdateData = {
        customerCode: customerOrderCode,
        number: orderData.body.orderCode
      }
    }

    // update order status
    if (trip.flight) {
      flightOrder.customerCode = flightUpdateData.customerCode
      flightOrder.number = flightUpdateData.number
      flightOrder.status = 'processing'
      await flightOrder.save()
    }

    if (trip.hotel) {
      hotelOrder.customerCode = hotelUpdateData.customerCode
      hotelOrder.number = hotelUpdateData.number
      hotelOrder.status = 'completed'
      hotelOrder.canCancel = true
      await hotelOrder.save()
    }

    res.status(200).send({
      status: charge.status,
      trip: _.pick(trip, ['_id']),
      flightOrder,
      hotelOrder
    })
  } catch (error) {
    // update order status to failed if something went wrong
    if (trip.flight && flightOrder) {
      flightOrder.status = 'failed'
      await flightOrder.save()
    }

    if (trip.hotel && hotelOrder) {
      hotelOrder.status = 'failed'
      await hotelOrder.save()
    }

    res.status(400).send({
      ...error,
      trip: _.pick(trip, ['_id']),
      flightOrder,
      hotelOrder
    })
  }
})

router.post('/password', (req, res) => {
  let password = req.body.password

  if (!password) {
    return res.status(400).send()
  }

  req.user.authenticate(password, (err, user, passwordErr) => {
    if (passwordErr) {
      return res.status(400).send()
    }

    res.status(200).send({
      message: 'Verify successfully'
    })
  })
})

module.exports = router
