const express = require('express')
const router = express.Router()
const Card = require('../models/card')
const Trip = require('../models/trip')
const Order = require('../models/order')
const Company = require('../models/company')
const api = require('../modules/api')
const apiSabre = require('../modules/apiSabre')
const convert = require('xml-js')

const {
  sabreRestToken,
  sabreSoapSecurityToken
} = require('../middleware/sabre')
const apiHotelbeds = require('../modules/apiHotelbeds')
const { getCache, setCache } = require('../config/cache')
const {
  makeSegmentsData,
  makeRoomGuestDetails,
  makeHtbRoomPaxes,
  roundPrice
} = require('../modules/utils')
const moment = require('moment')
const _ = require('lodash')
const { removeSpaces, roundingAmountStripe } = require('../modules/utils')
const { logger } = require('../config/winston')
const {
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary,
  emailGiamsoIssueTicket,
  emailNotEnoughDeposit
} = require('../middleware/email')
const { currentCompany } = require('../middleware/company')
const { currenciesExchange } = require('../middleware/currency')
const { getTasAdminOptions } = require('../middleware/options')
const {
  isPartnerBooking,
  updateBookingRequest
} = require('../middleware/partnerAdmin')
const { makeExpensesAfterCheckout } = require('../middleware/expense')

const {
  makeSabreFlightsData,
  makeHotelbedsHotelsData,
  markupHotels,
  markupFlights
} = require('../modules/utils')
const { ObjectID } = require('mongodb')

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const verifySabrePrice = async (req, res, next) => {
  // get sabre cache key
  // get sabre-currency -> company currency
  // find flight, assign rate
  let trip = req.body.trip
  let sabreCacheKey = _.get(req.body, 'flightCacheKey.sabre')

  // if no flights or flight is not from sabre, go next()
  if (!trip.flight || !sabreCacheKey) {
    return next()
  }

  try {
    let sabreCacheData = await getCache(sabreCacheKey)
    let currencies = await currenciesExchange()
    let sabreCurrency =
      currencies[`${process.env.SABRE_BASE_CURRENCY}-${req.company.currency}`]

    let flights = makeSabreFlightsData(
      sabreCacheData.sabreRes,
      sabreCurrency,
      sabreCacheData.numberOfPassengers
    )
    flights = markupFlights(
      flights,
      sabreCurrency,
      req.markupOptions.flight.value
    )

    let flightInCache = flights.find(f => f.id === req.body.trip.flight.id)

    req.body.trip.flight = flightInCache
  } catch (e) {
    return res.status(400).send({
      code: 'SABRE-VERIFY-FLIGHT',
      message: 'Cannot verify price of this flight'
    })
  }

  next()
}

const verifyHotelbedsPrice = async (req, res, next) => {
  // get hotel cache key
  // get hotelbeds-currency -> company-currency
  // find rate, assign rate
  let trip = req.body.trip
  let hotelbedsCacheKey = _.get(req.body, 'hotelCacheKey.hotelbeds')

  // if no hotels or hotel is not from hotelbeds, go next()
  if (!trip.hotel || !hotelbedsCacheKey) {
    return next()
  }

  try {
    let hotelbedsData = await getCache(hotelbedsCacheKey)
    let currencies = await currenciesExchange()
    let hotelbedsCurrency =
      currencies[
        `${process.env.HOTELBEDS_BASE_CURRENCY}-${req.company.currency}`
      ]

    let hotels = makeHotelbedsHotelsData(
      hotelbedsData.hotels,
      hotelbedsData.rooms,
      hotelbedsCurrency
    )
    hotels = markupHotels(
      hotels,
      hotelbedsCurrency,
      req.markupOptions.hotel.value
    )

    let hotelInCache = hotels.find(
      f => f.hotelId === req.body.trip.hotel.hotelId
    )

    let roomInCache = _.get(hotelInCache, 'ratePlans.ratePlanList', []).find(
      r => r.ratePlanCode === req.body.trip.hotel.ratePlanCode
    )

    if (!roomInCache) {
      throw new Error('Cannot find room in cache')
    }

    let ratePlanSplits = req.body.trip.hotel.ratePlanCode.split('|')
    let checkInDate = ratePlanSplits[0]
    checkInDate = `${checkInDate.slice(0, 4)}-${checkInDate.slice(
      4,
      6
    )}-${checkInDate.slice(6, 8)}`
    let checkOutDate = ratePlanSplits[1]
    checkOutDate = `${checkOutDate.slice(0, 4)}-${checkOutDate.slice(
      4,
      6
    )}-${checkOutDate.slice(6, 8)}`

    req.body.trip.hotel = {
      ..._.pick(req.body.trip.hotel, ['hotelId', 'ratePlanCode', 'remark']),
      ...hotelInCache,
      ...roomInCache,
      checkInDate,
      checkOutDate,
      numberOfAdult: roomInCache.adults,
      numberOfRoom: roomInCache.rooms
    }
  } catch (e) {
    return res.status(400).send({
      code: 'HOTELBEDS-VERIFY-HOTEL',
      message: 'Cannot verify price of this hotel'
    })
  }

  next()
}

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
              ..._.omit(trip, ['_id', 'startDate', 'endDate', 'name']),
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
        _creator: req.user._id,
        status: 'ongoing'
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
          flight: {
            ...trip.flight,
            rawTotalPrice: trip.flight.originalTotalPrice,
            totalPrice: trip.flight.exchangedTotalPrice
          },
          _customer: req.user._id,
          _company: req.user._company,
          _partner: _.get(req, 'user._partner', null),
          _bookedBy: req._bookedBy,
          passengers: trip.passengers,
          contactInfo: trip.contactInfo,
          discountCode: trip.discountCode
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
          _company: req.user._company,
          _partner: _.get(req, 'user._partner', null),
          _bookedBy: req._bookedBy,
          passengers: trip.passengers,
          childrenInfo: trip.childrenInfo,
          contactInfo: trip.contactInfo,
          remark: trip.hotel.remark,
          discountCode: trip.discountCode
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

const calculateRewardCost = async (req, res, next) => {
  // don't need to calculate for existing order
  if (req.body.checkoutAgain) {
    next()
  }

  let flightOrder = req.flightOrder
  let hotelOrder = req.hotelOrder

  try {
    let foundBusinessTrip = await Trip.findOne({
      _creator: req.user._id,
      _id: req.trip._id
    })

    // calculate reward cost for new orders
    let flightBudget = _.get(
      foundBusinessTrip,
      'budgetPassengers[0].flight.price',
      0
    )
    let hotelBudget = _.get(
      foundBusinessTrip,
      'budgetPassengers[0].lodging.price',
      0
    )

    let tripsSpend = await Trip.aggregate([
      {
        $match: {
          _id: foundBusinessTrip._id,
          _creator: req.user._id,
          businessTrip: true,
          $or: [
            {
              status: 'approved'
            },
            {
              status: 'ongoing'
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: '_trip',
          as: 'orders'
        }
      },
      {
        $unwind: '$orders'
      },
      {
        $group: {
          _id: '$_id',
          totalFlightSpend: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: ['$orders.type', 'flight']
                    },
                    {
                      $in: [
                        '$orders.status',
                        ['completed', 'processing', 'cancelling']
                      ]
                    }
                  ]
                },
                then: '$orders.totalPrice',
                else: 0
              }
            }
          },
          totalHotelSpend: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: ['$orders.type', 'hotel']
                    },
                    {
                      $in: ['$orders.status', ['completed']]
                    }
                  ]
                },
                then: '$orders.totalPrice',
                else: 0
              }
            }
          }
        }
      }
    ])

    let totalFlightSpend = _.get(tripsSpend, '[0].totalFlightSpend', 0)
    let totalHotelSpend = _.get(tripsSpend, '[0].totalHotelSpend', 0)

    let flightTotalPrice = _.get(req, 'flightOrder.totalPrice', 0)
    let hotelTotalPrice = _.get(req, 'hotelOrder.totalPrice', 0)

    let exchangedRate = req.company.exchangedRate

    let remainingFlightBudget =
      flightBudget - totalFlightSpend - flightTotalPrice
    let remainingHotelBudget = hotelBudget - totalHotelSpend - hotelTotalPrice

    if (remainingFlightBudget > 0 && flightTotalPrice > 0) {
      let currencyRate = flightOrder.totalPrice / flightOrder.rawTotalPrice
      flightOrder.rewardCost = roundPrice(
        (exchangedRate * remainingFlightBudget) / 100,
        flightOrder.currency
      )
      flightOrder.totalPrice = roundPrice(
        flightOrder.totalPrice + flightOrder.rewardCost,
        flightOrder.currency
      )
      flightOrder.rawTotalPrice = roundPrice(
        flightOrder.totalPrice / currencyRate,
        flightOrder.rawCurrency
      )
      await flightOrder.save()
    }

    if (remainingHotelBudget > 0 && hotelTotalPrice > 0) {
      let currencyRate = hotelOrder.totalPrice / hotelOrder.rawTotalPrice
      hotelOrder.rewardCost = roundPrice(
        (exchangedRate * remainingHotelBudget) / 100,
        hotelOrder.currency
      )
      hotelOrder.totalPrice = roundPrice(
        hotelOrder.totalPrice + hotelOrder.rewardCost,
        hotelOrder.currency
      )
      hotelOrder.rawTotalPrice = roundPrice(
        hotelOrder.totalPrice / currencyRate,
        hotelOrder.rawCurrency
      )
      await hotelOrder.save()
    }
  } catch (e) {}

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
      amount += flightOrder.totalPrice

      currency = flightOrder.currency
    } // end flight

    // if have hotel
    if (hotelOrder && hotelOrder.hotel) {
      amount += hotelOrder.totalPrice

      currency = hotelOrder.currency
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
      customer: foundCard.customer.id, // Previously stored, then retrieved
      capture: false
    })

    req.charge = charge
    // AFTER CHARGING =======

    // save charge info data
    if (flightOrder) {
      flightOrder.chargeId = charge.id
      flightOrder.chargeInfo = charge

      await flightOrder.save()
    }

    if (hotelOrder) {
      hotelOrder.chargeId = charge.id
      hotelOrder.chargeInfo = charge
      await hotelOrder.save()
    }
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const depositCharging = async (req, res, next) => {
  try {
    // if error occurs before
    if (req.checkoutError) {
      throw req.checkoutError
    }

    const flightOrder = req.flightOrder
    const hotelOrder = req.hotelOrder

    // START CHARGING =======

    // calculate the trip price here
    let currency = ''
    let amount = 0
    let note = 'checkout for orders:'

    // if have flight
    if (flightOrder && flightOrder.flight) {
      amount += flightOrder.totalPrice
      note += ' ' + _.get(req, 'flightOrder._id', '')
      currency = flightOrder.currency
    }

    // if have hotel
    if (hotelOrder && hotelOrder.hotel) {
      amount += hotelOrder.totalPrice
      note += ' ' + _.get(req, 'hotelOrder._id', '')
      currency = hotelOrder.currency
    }

    // log changing
    let company = req.company
    let { deposit, isCreditLimitation, remainingCredit } = company
    let newDeposit = company.deposit
    let newRemainingCredit = company.remainingCredit
    remainingCredit = isCreditLimitation ? remainingCredit : 0
    let newLogs = []

    // in case have enough money
    if (deposit + remainingCredit >= amount) {
      let _creator
      // set _creator for company logs
      if (!_.isEmpty(req.partnerAdmin)) {
        _creator = req.partnerAdmin._id
      } else {
        _creator = req.user._id
      }
      // have enough deposit
      if (deposit >= amount) {
        newDeposit = deposit - amount
      } else {
        // use credit
        newDeposit = 0
        newRemainingCredit = remainingCredit - (amount - deposit)

        newLogs.push({
          _creator,
          createdAt: new Date(),
          field: 'remainingCredit',
          old: remainingCredit,
          new: newRemainingCredit,
          note
        })
      }

      if (newDeposit !== deposit) {
        newLogs.push({
          _creator,
          createdAt: new Date(),
          field: 'deposit',
          old: deposit,
          new: newDeposit,
          note
        })
        req.company.deposit = newDeposit
      }

      req.company.remainingCredit = newRemainingCredit

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
    } else {
      req.depositError = {
        message: 'Remaining deposit is not enough for the trip.'
      }
      throw new Error('Remaining deposit is not enough for the trip.')
    }

    let charge = {
      amount,
      currency,
      _id: new ObjectID(),
      _company: company._id,
      _createdAt: new Date(),
      paymentType: 'deposit'
    }

    req.charge = charge

    // AFTER CHARGING =======
    // save charge info data
    if (flightOrder) {
      flightOrder.chargeId = charge._id
      flightOrder.chargeInfo = charge

      await flightOrder.save()
    }

    if (hotelOrder) {
      hotelOrder.chargeId = charge._id
      hotelOrder.chargeInfo = charge

      await hotelOrder.save()
    }
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const stripePartnerCharging = async (req, res, next) => {
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
      amount += flightOrder.totalPrice

      currency = flightOrder.currency
    } // end flight

    // if have hotel
    if (hotelOrder && hotelOrder.hotel) {
      amount += hotelOrder.totalPrice

      currency = hotelOrder.currency
    }

    // rounding amount
    amount = roundingAmountStripe(amount, currency)

    // find the card
    let foundCard = await Card.findOne({
      _id: cardId,
      owner: req.partnerAdmin._id // use partner's card
    })

    if (!foundCard) {
      throw { message: 'Cannot find card' }
    }

    // charge the customer
    const charge = await stripe.charges.create({
      amount,
      currency,
      customer: foundCard.customer.id, // Previously stored, then retrieved
      capture: false
    })

    req.charge = charge
    // AFTER CHARGING =======

    // save charge info data
    if (flightOrder) {
      flightOrder.chargeId = charge.id
      flightOrder.chargeInfo = charge

      await flightOrder.save()
    }

    if (hotelOrder) {
      hotelOrder.chargeId = charge.id
      hotelOrder.chargeInfo = charge

      await hotelOrder.save()
    }
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

  // if error occurs before
  if (req.checkoutError) {
    return next()
  }

  try {
    let data = {
      CreatePassengerNameRecordRQ: {
        targetCity: process.env.SABRE_USER_ID,
        version: '2.2.0',
        haltOnAirPriceError: true,
        TravelItineraryAddInfo: {
          AgencyInfo: {
            Ticketing: {
              TicketType: '7TAW',
              QueueNumber: 100 // set Queue Number - move queue number to ticketing
            }
          },
          CustomerInfo: {
            ContactNumbers: {
              ContactNumber: [
                {
                  Phone: `${trip.contactInfo.callingCode}-${
                    trip.contactInfo.phone
                  }`,
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
        SpecialReqDetails: {
          AddRemark: {
            RemarkInfo: {
              Remark: [
                {
                  Type: 'General',
                  Text: process.env.SABRE_GIAMSO_CODE
                }
              ]
            }
          }
        },
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
      // add passenger infor
      data.CreatePassengerNameRecordRQ.TravelItineraryAddInfo.CustomerInfo.PersonName.push(
        {
          PassengerType: 'ADT',
          GivenName: p.firstName,
          Surname: p.lastName
        }
      )
      // add passenger email
      data.CreatePassengerNameRecordRQ.TravelItineraryAddInfo.CustomerInfo.Email.push(
        {
          Address: p.businessEmail,
          Type: 'CC'
        }
      )
    })

    trip.flight.departureSegments.map(segment => {
      // map airline infor
      data.CreatePassengerNameRecordRQ.AirBook.OriginDestinationInformation.FlightSegment.push(
        {
          DepartureDateTime: segment.DepartureDateTime,
          FlightNumber: `${segment.marketingFlightNumber}`,
          ArrivalDateTime: segment.ArrivalDateTime,
          Status: 'NN',
          ResBookDesigCode: segment.bookingCode,
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

    // return segments
    _.get(trip, 'flight.returnSegments', []).map(segment => {
      // map airline infor
      data.CreatePassengerNameRecordRQ.AirBook.OriginDestinationInformation.FlightSegment.push(
        {
          DepartureDateTime: segment.DepartureDateTime,
          FlightNumber: `${segment.marketingFlightNumber}`,
          ArrivalDateTime: segment.ArrivalDateTime,
          Status: 'NN',
          ResBookDesigCode: segment.bookingCode,
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
    let sabrePNRres = await apiSabre.createPNR(data, req.sabreRestToken)
    logger.info('createPNR response', sabrePNRres.data)

    let status = _.get(
      sabrePNRres,
      ['data', 'CreatePassengerNameRecordRS', 'ApplicationResults', 'status'],
      'failed'
    )

    if (status === 'Complete') {
      let pnr = _.get(
        sabrePNRres,
        ['data', 'CreatePassengerNameRecordRS', 'ItineraryRef', 'ID'],
        ''
      )
      flightOrder.customerCode = pnr // just virtual pnr
      flightOrder.status = 'processing'
      flightOrder.canCancel = true
      await flightOrder.save()
      req.flightOrder = flightOrder
    } else {
      throw {
        message: _.get(
          sabrePNRres,
          'headers[error-message]',
          'Create PNR failed!'
        ),
        flight: true
      }
    }
  } catch (error) {
    logger.error('SabrePNRError', { error: _.get(error, 'response.data', {}) })
    req.checkoutError = {
      ..._.get(error, 'response.data', {}),
      message: _.get(error, 'message'),
      flight: true
    }
  }

  next()
}

const sabreMoveQueueNumber = async (req, res, next) => {
  const trip = req.trip
  if (_.get(trip, 'flight.supplier') !== 'sabre') {
    next()
    return
  }

  // if error occurs before
  if (req.checkoutError) {
    return next()
  }
  try {
    let xmlBodyStr = ` <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eb="http://www.ebxml.org/namespaces/messageHeader" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsd="http://www.w3.org/1999/XMLSchema">
    <SOAP-ENV:Header>
        <eb:MessageHeader SOAP-ENV:mustUnderstand="1" eb:version="1.0">
            <eb:ConversationId>1</eb:ConversationId>
            <eb:From>
                <eb:PartyId type="urn:x12.org:IO5:01">999999</eb:PartyId>
            </eb:From>
            <eb:To>
                <eb:PartyId type="urn:x12.org:IO5:01">123123</eb:PartyId>
            </eb:To>
            <eb:CPAId>${process.env.SABRE_USER_ID}</eb:CPAId>
            <eb:Service eb:type="OTA">QueueMoveLLSRQ</eb:Service>
            <eb:Action>QueueMoveLLSRQ</eb:Action>
        </eb:MessageHeader>
        <wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2002/12/secext">
            <wsse:BinarySecurityToken valueType="String" EncodingType="wsse:Base64Binary">${
              req.sabreSoapSecurityToken
            }</wsse:BinarySecurityToken>
        </wsse:Security>
    </SOAP-ENV:Header>
    <SOAP-ENV:Body>
    <QueueMoveRQ Version="2.0.0" xmlns="http://webservices.sabre.com/sabreXML/2011/10" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <QueueInfo>
          <DestinationQueue>
              <QueueIdentifier Number="411" PseudoCityCode="R698"/>
          </DestinationQueue>
          <OriginQueue>
              <QueueIdentifier Number="100" PseudoCityCode="${
                process.env.SABRE_USER_ID
              }"/>
          </OriginQueue>
      </QueueInfo>
  </QueueMoveRQ>
  </SOAP-ENV:Body>
  </SOAP-ENV:Envelope>
  `

    let sabreRes = await apiSabre.callSabreSoapAPI(xmlBodyStr)
    let result = convert.xml2json(sabreRes.data, { compact: true, spaces: 4 })
    result = JSON.parse(result)
    logger.info('moveQueue res', result)
  } catch (e) {
    logger.info('moveQueue err', e)
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
      await hotelOrder.save()

      req.hotelOrder = hotelOrder
    }
  } catch (error) {
    req.checkoutError = {
      ...req.checkoutError,
      message:
        _.get(error, 'response.data.header.message') || _.get(error, 'message'),
      hotel: true
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
    logger.error('CheckRateERR', _.get(error, 'response.data'))
    req.checkoutError = {
      message: _.get(
        error,
        'response.data.error.message',
        _.get(error, 'message', '')
      )
    }
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
      remark: trip.hotel.remark,
      tolerance: Number(process.env.HOTELBEDS_TOLERANCE) * 1.0
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
    await hotelOrder.save()

    req.hotelOrder = hotelOrder
  } catch (error) {
    logger.error('BookingERR', _.get(error, 'response.data'))

    req.checkoutError = {
      ...req.checkoutError,
      message:
        _.get(error, 'response.data.error.message') || _.get(error, 'message'),
      hotel: true
    }
  }

  next()
}

// just for demo and dev purpose only
const demoForceCompletedOrders = async (req, res, next) => {
  // not for production
  if (process.env.NODE_ENV === 'production') {
    return next()
  }

  // not enable demo force completed orders
  if (process.env.DEMO_FORCE_COMPLETED_ORDERS !== '1') {
    return next()
  }

  // clear checkout error
  req.checkoutError = undefined

  let flightOrder = req.flightOrder
  let hotelOrder = req.hotelOrder

  // if flight order failed, force it status and pnr
  if (flightOrder && flightOrder.status !== 'processing') {
    flightOrder.pnr = 'DEMO-PNR'
    flightOrder.status = 'completed'
    await flightOrder.save()
  }

  // if hotel order failed, force it status and customer code
  if (hotelOrder && hotelOrder.status !== 'completed') {
    hotelOrder.customerCode = 'DEMO-BOOKING-CODE'
    hotelOrder.status = 'completed'
    await hotelOrder.save()
  }

  next()
}

const refundFailedOrder = async (req, res, next) => {
  // exit if no checkout errors
  // or no charge, run to another middleware
  if (!req.checkoutError || !req.charge) {
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

    // capture the success amount and refund fail amount
    if (refundAmount > 0 && refundAmount < req.charge.amount) {
      let capture = await stripe.charges.capture(req.charge.id, {
        amount: req.charge.amount - refundAmount
      })
      return next() // exit
    }

    // refund total (cancelled) via stripe
    if (refundAmount > 0) {
      await stripe.refunds.create({
        charge: req.charge.id,
        amount: refundAmount
      })
    }
  } catch (error) {
    req.checkoutError = error
  }

  next()
}

const refundDepositFailedOrder = async (req, res, next) => {
  // exit if no checkout errors
  // or no charge, run to another middleware
  if (!req.checkoutError || !req.charge) {
    next()
    return
  }
  try {
    let refundAmount = 0
    let note = 'refund for orders: '

    // refund for flight booking failed
    if (req.checkoutError && req.checkoutError.flight) {
      let flightOrder = req.flightOrder
      refundAmount += flightOrder.totalPrice
      note += ' ' + _.get(req, 'flightOrder._id', '')

      // refund for combo (flight & hotel) if flight booking failed
      let hotelOrder = req.hotelOrder
      if (!_.isEmpty(hotelOrder)) {
        refundAmount += hotelOrder.totalPrice
        note += _.get(req, 'hotelOrder._id', '')
      }

      // if only hotel failed
    } else if (req.checkoutError && req.checkoutError.hotel) {
      // refund for hotel booking failed
      let hotelOrder = req.hotelOrder
      refundAmount += hotelOrder.totalPrice
      note += ' ' + _.get(req, 'hotelOrder._id', '')

      // success flight and fail hotel
      if (req.flightOrder) {
        req.checkoutError = undefined

        // change status of hotel to failed
        hotelOrder.status = 'failed'
        await hotelOrder.save()
      }
    }

    // refund
    let company = req.company
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
    let _creator
    // set _creator for company logs
    if (!_.isEmpty(req.partnerAdmin)) {
      _creator = req.partnerAdmin._id
    } else {
      _creator = req.user._id
    }
    if (!isCreditLimitation) {
      newDeposit += refundAmount
    } else {
      if (creditLimitationAmount - company.remainingCredit >= refundAmount) {
        newRemainingCredit += refundAmount
      } else {
        newRemainingCredit = creditLimitationAmount
        newDeposit += refundAmount - (creditLimitationAmount - remainingCredit)
      }

      if (newRemainingCredit !== remainingCredit) {
        newLogs.push({
          _creator,
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
        _creator,
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

  let bookingResponse = req.bookingResponse
  try {
    if (req.checkoutError) {
      throw req.checkoutError
    }
    res.status(200).send({
      status: _.get(req, 'charge.status'),
      trip: _.pick(trip, ['_id']),
      flightOrder: {
        status: _.get(flightOrder, 'status')
      },
      hotelOrder: {
        status: _.get(hotelOrder, 'status')
      }
    })
  } catch (error) {
    logger.error('checkoutERR', _.get(error, 'message', ''))
    // update order status to failed if something went wrong
    if (trip && trip.flight && flightOrder) {
      flightOrder.status = 'failed'
      await flightOrder.save()
    }

    if (trip && trip.hotel && hotelOrder) {
      hotelOrder.status = 'failed'
      await hotelOrder.save()
    }

    res.status(400).send({
      message: _.get(error, 'message'),
      trip: _.pick(trip, ['_id']),
      flightOrder: {
        status: _.get(flightOrder, 'status')
      },
      hotelOrder: {
        status: _.get(hotelOrder, 'status')
      }
    })
  }
  next() // next for sent email
}

const validateDepositPayment = (req, res, next) => {
  if (req.company.payment !== 'deposit') {
    return res.status(400).send()
  }
  next()
}

const setBookedByUser = (req, res, next) => {
  // set _bookedBy after check isPartnerAdmin
  if (!_.isEmpty(req.partnerAdmin)) {
    req._bookedBy = req.partnerAdmin._id
  } else {
    req._bookedBy = req.user._id
  }
  next()
}

router.post(
  '/card',
  setBookedByUser,
  currentCompany,
  getTasAdminOptions,
  verifySabrePrice,
  verifyHotelbedsPrice,
  sabreRestToken, // get token for sabre api
  createOrFindTrip,
  createOrFindFlightOrder,
  createOrFindHotelOrder,
  calculateRewardCost,
  pkfareFlightPreBooking,
  hotelbedsCheckRate,
  stripeCharging,
  pkfareFlightTicketing,
  sabreSoapSecurityToken,
  sabreCreatePNR,
  sabreMoveQueueNumber,
  pkfareHotelCreateOrder,
  hotelbedsCreateOrder,
  demoForceCompletedOrders,
  refundFailedOrder,
  responseCheckout,
  makeExpensesAfterCheckout,
  emailGiamsoIssueTicket,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary
)

router.post(
  '/deposit',
  setBookedByUser,
  currentCompany,
  validateDepositPayment,
  getTasAdminOptions,
  verifySabrePrice,
  verifyHotelbedsPrice,
  sabreRestToken, // get token for sabre api
  createOrFindTrip,
  createOrFindFlightOrder,
  createOrFindHotelOrder,
  calculateRewardCost,
  pkfareFlightPreBooking,
  hotelbedsCheckRate,
  depositCharging,
  pkfareFlightTicketing,
  sabreSoapSecurityToken,
  sabreCreatePNR,
  sabreMoveQueueNumber,
  pkfareHotelCreateOrder,
  hotelbedsCreateOrder,
  demoForceCompletedOrders,
  refundDepositFailedOrder,
  responseCheckout,
  makeExpensesAfterCheckout,
  emailGiamsoIssueTicket,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary,
  emailNotEnoughDeposit
)

router.post(
  '/partner-card',
  isPartnerBooking,
  setBookedByUser,
  currentCompany,
  getTasAdminOptions,
  verifySabrePrice,
  verifyHotelbedsPrice,
  sabreRestToken, // get token for sabre api
  createOrFindTrip,
  createOrFindFlightOrder,
  createOrFindHotelOrder,
  calculateRewardCost,
  pkfareFlightPreBooking,
  hotelbedsCheckRate,
  stripePartnerCharging,
  pkfareFlightTicketing,
  sabreSoapSecurityToken,
  sabreCreatePNR,
  sabreMoveQueueNumber,
  pkfareHotelCreateOrder,
  hotelbedsCreateOrder,
  demoForceCompletedOrders,
  refundFailedOrder,
  responseCheckout,
  makeExpensesAfterCheckout,
  emailGiamsoIssueTicket,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary,
  updateBookingRequest
)

router.post(
  '/partner-deposit',
  isPartnerBooking,
  setBookedByUser,
  currentCompany,
  validateDepositPayment,
  getTasAdminOptions,
  verifySabrePrice,
  verifyHotelbedsPrice,
  sabreRestToken, // get token for sabre api
  createOrFindTrip,
  createOrFindFlightOrder,
  createOrFindHotelOrder,
  calculateRewardCost,
  pkfareFlightPreBooking,
  hotelbedsCheckRate,
  depositCharging,
  pkfareFlightTicketing,
  sabreSoapSecurityToken,
  sabreCreatePNR,
  sabreMoveQueueNumber,
  pkfareHotelCreateOrder,
  hotelbedsCreateOrder,
  demoForceCompletedOrders,
  refundDepositFailedOrder,
  responseCheckout,
  makeExpensesAfterCheckout,
  emailGiamsoIssueTicket,
  emailEmployeeCheckoutFailed,
  emailEmployeeItinerary,
  emailNotEnoughDeposit,
  updateBookingRequest
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
