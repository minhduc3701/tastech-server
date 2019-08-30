const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const Trip = require('../models/trip')
const Order = require('../models/order')
const api = require('../modules/api')
const apiSabre = require('../modules/apiSabre')
const { sabreToken } = require('../middleware/sabre')
const apiHotelbeds = require('../modules/apiHotelbeds')
const {
  makeSegmentsData,
  makeRoomGuestDetails,
  makeHtbRoomPaxes
} = require('../modules/utils')
const moment = require('moment')
const _ = require('lodash')
const { removeSpaces, roundingAmountStripe } = require('../modules/utils')
const { logger } = require('../config/winston')
const {
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary
} = require('../middleware/email')
// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const createOrFindTrip = async (req, res, next) => {
  const { trip, checkoutAgain } = req.body
  let foundTrip

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

    req.trip = trip
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const createOrFindFlightOrder = async (req, res, next) => {
  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    const { checkoutAgain, orderId } = req.body

    // from createOrFindTrip
    const trip = req.trip

    let flightOrder

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

    req.flightOrder = flightOrder
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const createOrFindHotelOrder = async (req, res, next) => {
  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    const { checkoutAgain, orderId } = req.body

    // from createOrFindTrip
    const trip = req.trip

    let hotelOrder

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
          childrenInfo: trip.childrenInfo,
          contactInfo: trip.contactInfo
        })
      }

      await hotelOrder.save()

      req.hotelOrder = hotelOrder
    }
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const pkfareFlightPreBooking = async (req, res, next) => {
  const trip = req.trip
  let bookingResponse

  if (_.get(trip, 'flight.supplier') !== 'pkfare') {
    next()
    return
  }

  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
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

      logger.info('preBookingRQ', data)

      bookingResponse = await api.preciseBooking(data)

      logger.info('preBookingRS', bookingResponse.data)

      // save for using later in ticketing
      req.bookingResponse = bookingResponse

      if (bookingResponse.data.errorCode !== '0') {
        req.checkoutError = {
          ...bookingResponse.data,
          message: bookingResponse.data.errorMsg,
          flight: true
        }
      }
    } // end trip.flight
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const stripeCharging = async (req, res, next) => {
  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    const flightOrder = req.flightOrder
    const hotelOrder = req.hotelOrder

    const { card } = req.body
    let cardId = card.id

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

    // rounding amount
    amount = roundingAmountStripe(amount, currency)

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

    req.charge = charge
    // AFTER CHARGING =======
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const pkfareFlightTicketing = async (req, res, next) => {
  const trip = req.trip

  if (_.get(trip, 'flight.supplier') !== 'pkfare') {
    next()
    return
  }
  let flightOrder = req.flightOrder
  let bookingResponse = req.bookingResponse
  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    // update data for trip
    let flightUpdateData = {}

    // ticketing
    if (trip.flight) {
      let { pnr, orderNum } = bookingResponse.data.data

      let orderPricingRequest = {
        orderNum
      }

      logger.info('orderPricingRQ', orderPricingRequest)

      let orderPricingRes = await api.orderPricing(orderPricingRequest)

      logger.info('orderPricingRS', orderPricingRes.data)

      let ticketingRequest = {
        email: trip.contactInfo.email,
        name: removeSpaces(trip.contactInfo.name),
        orderNum,
        PNR: pnr,
        telNum: `+${trip.contactInfo.callingCode} ${trip.contactInfo.phone}`
      }

      logger.info('ticketingRQ', ticketingRequest)

      let ticketingRes = await api.ticketing(ticketingRequest)

      logger.info('ticketingRS', ticketingRes.data)

      if (ticketingRes.data.errorCode !== '0') {
        throw { message: ticketingRes.data.errorMsg, flight: true }
      }

      flightUpdateData = {
        customerCode: pnr,
        number: orderNum
      }

      flightOrder.customerCode = flightUpdateData.customerCode
      flightOrder.number = flightUpdateData.number
      flightOrder.status = 'processing'
      flightOrder.chargeId = req.charge.id
      await flightOrder.save()

      req.flightOrder = flightOrder
    } // end trip.flight
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const sabreCreatePNR = async (req, res, next) => {
  const trip = req.trip
  let flightOrder = req.flightOrder
  if (_.get(trip, 'flight.supplier') !== 'sabre') {
    next()
    return
  }

  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }
    let data = {
      CreatePassengerNameRecordRQ: {
        targetCity: process.env.SABRE_USER_ID,
        version: '2.2.0',
        haltOnAirPriceError: true,
        TravelItineraryAddInfo: {
          AgencyInfo: {
            Ticketing: {
              TicketType: '7TAW'
            }
          },
          CustomerInfo: {
            ContactNumbers: {
              ContactNumber: [
                {
                  Phone: trip.contactInfo.phone,
                  PhoneUseType: 'H'
                }
              ]
            },
            Email: [
              {
                Address: trip.contactInfo.email,
                Type: 'TO'
              }
            ],
            PersonName: []
          }
        },
        AirBook: {
          OriginDestinationInformation: {
            FlightSegment: []
          },
          RedisplayReservation: {
            NumAttempts: 2,
            WaitInterval: 5000
          }
        },
        AirPrice: [
          {
            PriceRequestInformation: {
              OptionalQualifiers: {
                PricingQualifiers: {
                  PassengerType: [
                    {
                      Code: 'ADT',
                      Quantity: trip.numberPassengers.toString()
                    }
                  ]
                }
              },
              Retain: true
            }
          }
        ],
        PostProcessing: {
          EndTransaction: {
            Source: {
              ReceivedFrom: 'EzBizTrip'
            }
          },
          RedisplayReservation: {
            waitInterval: 100
          }
        }
      }
    }
    trip.passengers.map((p, index) => {
      data.CreatePassengerNameRecordRQ.TravelItineraryAddInfo.CustomerInfo.PersonName.push(
        {
          PassengerType: 'ADT',
          GivenName: p.firstName,
          Surname: p.lastName
        }
      )
    })
    trip.flight.departureSegments.map(segment => {
      data.CreatePassengerNameRecordRQ.AirBook.OriginDestinationInformation.FlightSegment.push(
        {
          DepartureDateTime: segment.DepartureDateTime,
          FlightNumber: `${segment.operatingFlightNumber}`,
          ArrivalDateTime: segment.ArrivalDateTime,
          Status: 'NN',
          ResBookDesigCode: segment.cabinCode,
          NumberInParty: `${trip.passengers.length}`,
          MarketingAirline: {
            Code: `${segment.marketing}`,
            FlightNumber: `${segment.marketingFlightNumber}`
          },
          MarriageGrp: 'O',
          OperatingAirline: {
            Code: `${segment.operating}`
          },
          OriginLocation: {
            LocationCode: `${segment.departure}`
          },
          DestinationLocation: {
            LocationCode: `${segment.arrival}`
          }
        }
      )
    })
    logger.info('createPNR request', data)
    let sabrePNRres = await apiSabre.createPNR(data, req.sabreToken)
    let status = _.get(
      sabrePNRres,
      ['data', 'CreatePassengerNameRecordRS', 'ApplicationResults', 'status'],
      'failed'
    )
    logger.info('createPNR response', sabrePNRres)
    if (status === 'Complete') {
      flightOrder.customerCode = _.get(
        sabrePNRres,
        ['data', 'CreatePassengerNameRecordRS', 'ApplicationResults', 'status'],
        ''
      )
      flightOrder.status = 'processing'
      await flightOrder.save()
      req.flightOrder = flightOrder
    } else {
      throw { message: 'Create PNR failed!', flight: true }
    }
  } catch (error) {
    logger.info('error', error)
    req.checkoutError = error
  }

  next()
}

const pkfareHotelCreateOrder = async (req, res, next) => {
  const trip = req.trip

  if (_.get(trip, 'hotel.supplier') !== 'pkfare') {
    next()
    return
  }

  let hotelOrder = req.hotelOrder

  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    // update data for trip
    let hotelUpdateData = {}

    // create hotel order
    if (trip.hotel) {
      // https://www.drzon.net/posts/generate-random-order-number/
      const orderid = require('order-id')(process.env.PKFARE_HOTEL_ORDER_SECRET)
      const customerOrderCode = orderid.generate()

      let request = {
        checkInDate: trip.hotel.checkInDate,
        checkOutDate: trip.hotel.checkOutDate,
        contactEmail: trip.contactInfo.email,
        contactName: removeSpaces(trip.contactInfo.name),
        contactTel: `+${trip.contactInfo.callingCode} ${
          trip.contactInfo.phone
        }`,
        customerOrderCode,
        numberOfAdult: trip.hotel.numberOfAdult,
        numberOfRoom: trip.hotel.numberOfRoom,
        hotelId: trip.hotel.hotelId,
        ratePlanCode: trip.hotel.ratePlanCode,
        roomCode: trip.hotel.roomCode, // update 29/8/2019
        bedTypeCode: trip.hotel.selectedBedTypeId,
        roomGuestDetails: makeRoomGuestDetails(
          trip.passengers,
          trip.hotel.numberOfRoom
        ),
        totalPrice: trip.hotel.rawTotalPrice,
        nationality: '',
        languageCode: 'en_US'
      }

      const ageOfChildren = _.get(trip, 'childrenInfo', []).map(
        child => child.age
      )
      if (ageOfChildren.length > 0) {
        request['ageOfChildren'] = ageOfChildren
      }

      let holteOrderRes = await api.createHotelOrder(request)
      let orderData = holteOrderRes.data

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

      hotelOrder.customerCode = hotelUpdateData.customerCode
      hotelOrder.number = hotelUpdateData.number
      hotelOrder.status = 'completed'
      hotelOrder.canCancel = true
      hotelOrder.chargeId = req.charge.id
      await hotelOrder.save()

      req.hotelOrder = hotelOrder
    }
  } catch (error) {
    if (error.hotel) {
      req.checkoutError = error
    } else {
      req.checkoutError = {
        message: _.get(error, 'response.data.header.message'),
        hotel: true
      }
    }
  }
  next()
}

const hotelbedsCheckRate = async (req, res, next) => {
  const trip = req.trip
  const supplier = _.get(trip, 'hotel.supplier')
  const rateType = _.get(trip, 'hotel.rateType')

  if (supplier !== 'hotelbeds' || rateType !== 'RECHECK') {
    next()
    return
  }

  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    let request = {
      rooms: [
        {
          rateKey: trip.hotel.ratePlanCode
        }
      ]
    }

    logger.info('CheckRateRQ', request)

    let rateRes = await apiHotelbeds.checkRate(request)

    logger.info('CheckRateRS', rateRes.data)
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const hotelbedsCreateOrder = async (req, res, next) => {
  const trip = req.trip

  if (_.get(trip, 'hotel.supplier') !== 'hotelbeds') {
    next()
    return
  }

  let hotelOrder = req.hotelOrder
  let childrenInfo = _.get(trip, 'childrenInfo', [])

  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    let request = {
      holder: {
        name: trip.contactInfo.name,
        surname: trip.contactInfo.lastName
      },
      rooms: makeHtbRoomPaxes(
        trip.passengers,
        childrenInfo,
        trip.hotel.numberOfRoom,
        trip.hotel.ratePlanCode
      ),
      clientReference: 'EzBizTrip',
      remark: '',
      tolerance: 2.0
    }

    logger.info('BookingRQ', request)

    let hotelOrderRes = await apiHotelbeds.createHotelbedsOrder(request)
    let orderData = hotelOrderRes.data

    logger.info('BookingRS', orderData)

    // create hotel order
    hotelOrder.customerCode = orderData.booking.reference
    hotelOrder.number = orderData.booking.reference
    hotelOrder.supplierInfo = {
      rooms: _.get(orderData, 'booking.hotel.rooms'),
      vat: _.get(orderData, 'booking.hotel.supplier.vatNumber')
    }
    hotelOrder.status = 'completed'
    hotelOrder.canCancel = true
    hotelOrder.chargeId = req.charge.id
    await hotelOrder.save()

    req.hotelOrder = hotelOrder
  } catch (error) {
    req.checkoutError = {
      ...req.checkoutError,
      message: _.get(error, 'response.data.error.message'),
      hotel: true
    }
  }

  next()
}

const refundFailedOrder = async (req, res, next) => {
  // exit if no checkout errors
  if (!req.checkoutError) {
    next()
    return
  }

  try {
    let refundAmount = 0

    // refund for flight booking failed
    if (req.checkoutError && req.checkoutError.flight) {
      let flightOrder = req.flightOrder
      refundAmount += flightOrder.totalPrice

      // refund for combo (flight & hotel) if flight booking failed
      let hotelOrder = req.hotelOrder
      if (!_.isEmpty(hotelOrder)) {
        refundAmount += hotelOrder.totalPrice
      }

      refundAmount = roundingAmountStripe(refundAmount, flightOrder.currency)

      // if only hotel failed
    } else if (req.checkoutError && req.checkoutError.hotel) {
      // refund for hotel booking failed
      let hotelOrder = req.hotelOrder
      refundAmount += roundingAmountStripe(
        hotelOrder.totalPrice,
        hotelOrder.currency
      )

      // success flight and fail hotel
      if (req.flightOrder) {
        req.checkoutError = undefined

        // change status of hotel to failed
        hotelOrder.status = 'failed'
        await hotelOrder.save()
      }
    }

    // refund via stripe
    await stripe.refunds.create({
      charge: req.charge.id,
      amount: refundAmount
    })
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const responseCheckout = async (req, res, next) => {
  // from createOrFindTrip
  const trip = req.trip
  let flightOrder = req.flightOrder
  let hotelOrder = req.hotelOrder
  const charge = req.charge

  let bookingResponse = req.bookingResponse
  try {
    if (req.checkoutError) {
      throw req.checkoutError
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
  next() // next for sent email
}

router.post(
  '/card',
  sabreToken, // get token for sabre api
  createOrFindTrip,
  createOrFindFlightOrder,
  createOrFindHotelOrder,
  pkfareFlightPreBooking,
  hotelbedsCheckRate,
  sabreCreatePNR,
  stripeCharging,
  pkfareFlightTicketing,
  pkfareHotelCreateOrder,
  hotelbedsCreateOrder,
  refundFailedOrder,
  responseCheckout,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary
)

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
