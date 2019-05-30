const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const Trip = require('../models/trip')
const Order = require('../models/order')
const api = require('../modules/api')
const { makeSegmentsData, makeRoomGuestDetails } = require('../modules/utils')
const moment = require('moment')
const _ = require('lodash')

router.post('/card', async (req, res, next) => {
  const { card, trip } = req.body
  let cardId = card.id
  let processingTrip, flightOrder, hotelOrder, bookingResponse
  let { contactInfo } = trip

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  try {
    if (!trip._id) {
      processingTrip = new Trip({
        ...trip,
        _creator: req.user._id
      })
      await processingTrip.save()
    }

    // flight order
    if (trip.flight) {
      flightOrder = new Order({
        currency: trip.flight.currency,
        type: 'flight',
        _trip: processingTrip._id,
        flight: trip.flight,
        _customer: req.user._id
      })

      await flightOrder.save()
    }

    // hotel order
    if (trip.hotel) {
      hotelOrder = new Order({
        currency: trip.hotel.currency,
        type: 'hotel',
        _trip: processingTrip._id,
        hotel: trip.hotel,
        _customer: req.user._id
      })

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
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          nationality: passenger.nationality,
          psgType: 'ADT',
          sex: passenger.title === 'Mr' ? 'M' : 'F'
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

    let adultPriceBreakdown = ['adtFare', 'adtTax', 'tktFee']

    let serviceFeeBreadkdown = ['platformServiceFee', 'merchantFee']

    let amount = 0

    // if have flight
    if (flightOrder && flightOrder.flight) {
      let adultPrice = adultPriceBreakdown.reduce(
        (acc, fee) => flightOrder.flight[fee] + acc,
        0
      )
      adultPrice *= trip.passengers.length
      let serviceFee = serviceFeeBreadkdown.reduce(
        (acc, fee) => flightOrder.flight[fee] + acc,
        0
      )

      amount += Math.floor((adultPrice + serviceFee) * 100)

      currency = flightOrder.flight.currency
    } // end flight

    // if have hotel
    if (hotelOrder && hotelOrder.hotel) {
      amount += Math.floor(hotelOrder.hotel.totalPrice * 100)

      currency = hotelOrder.hotel.currency
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
        name: contactInfo.name,
        orderNum,
        PNR: pnr,
        telNum: contactInfo.phone1
      })

      flightUpdateData = {
        customerCode: pnr,
        number: orderNum
      }
    } // end trip.flight

    // create hotel order
    if (trip.hotel) {
      let customerOrderCode = `${process.env.PKFARE_HOTEL_ORDER_PREFIX}.${
        processingTrip._id
      }`

      let request = {
        checkInDate: trip.hotel.checkInDate,
        checkOutDate: trip.hotel.checkOutDate,
        contactEmail: contactInfo.email,
        contactName: contactInfo.name,
        contactTel: contactInfo.phone1,
        customerOrderCode,
        numberOfAdult: trip.hotel.numberOfAdult,
        numberOfRoom: trip.hotel.numberOfRoom,
        hotelId: trip.hotel.hotelId,
        ratePlanCode: trip.hotel.ratePlanCode,
        bedTypeCode: trip.hotel.bedTypeIdList[0],
        roomGuestDetails: makeRoomGuestDetails(
          trip.passengers,
          trip.hotel.numberOfRoom
        ),
        totalPrice: trip.hotel.totalPrice,
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
      trip: _.pick(processingTrip, ['_id'])
    })
  } catch (error) {
    // update order status to failed if something went wrong
    if (trip.flight) {
      flightOrder.status = 'failed'
      await flightOrder.save()
    }

    if (trip.hotel) {
      hotelOrder.status = 'failed'
      await hotelOrder.save()
    }

    res.status(400).send({
      ...error,
      trip: _.pick(processingTrip, ['_id'])
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
