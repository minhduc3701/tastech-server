const Policy = require('../models/policy')
const Expense = require('../models/expense')
const {
  makeSabreFlightsData,
  roundPriceWithMarkup
} = require('../modules/utils')
const {
  makeSabreSearchRequestFromBudget,
  makeSabreRequestData
} = require('../modules/utilsSabre')
const apiSabre = require('../modules/apiSabre')
const htbApi = require('../modules/apiHotelbeds')
const Trip = require('../models/trip')
const _ = require('lodash')

const calculateBudget = async (req, res, next) => {
  try {
    let budget = req.body.budgetPassengers[0]
    // get Policy
    let companyPolicies = await Policy.find({
      _company: req.user._company
    })
    let policy = await Policy.findById(req.user._policy)
    if (!policy || policy.status === 'disabled') {
      for (let index = 0; index < companyPolicies.length; index++) {
        if (companyPolicies[index]._doc.status === 'default') {
          policy = companyPolicies[index]
          break
        }
      }
    }

    req.trip.budgetPassengers[0].totalPrice = 0
    // calcuate transportation budget
    if (
      policy.setTransportLimit &&
      req.trip.budgetPassengers[0].transportation.selected
    ) {
      req.trip.budgetPassengers[0].transportation.price = Number(
        policy.transportLimit * req.trip.daysOfTrip
      )
      req.trip.budgetPassengers[0].transportation.limit = policy.transportLimit
      req.trip.budgetPassengers[0].totalPrice += Number(
        policy.transportLimit * req.trip.daysOfTrip
      )
    } else {
      req.trip.budgetPassengers[0].transportation.price = 0
    }

    // calcuate meal budget
    if (policy.setMealLimit && req.trip.budgetPassengers[0].meal.selected) {
      req.trip.budgetPassengers[0].meal.price = Number(
        policy.mealLimit * req.trip.daysOfTrip
      )
      req.trip.budgetPassengers[0].meal.limit = policy.mealLimit
      req.trip.budgetPassengers[0].totalPrice += Number(
        policy.mealLimit * req.trip.daysOfTrip
      )
    } else {
      req.trip.budgetPassengers[0].meal.price = 0
    }
    //update travel other
    if (req.trip.budgetPassengers[0].others.selected) {
      req.trip.budgetPassengers[0].totalPrice += Number(
        req.trip.budgetPassengers[0].others.amount
      )
    }

    // calculate Flight budget
    if (req.trip.budgetPassengers[0].flight.selected) {
      let budgetRequest = makeSabreSearchRequestFromBudget(
        req.trip.budgetPassengers[0].flight,
        policy
      )
      req.trip.budgetPassengers[0].flight.class = policy.flightClass
      try {
        let sabreRes = await apiSabre.shopping(
          makeSabreRequestData(budgetRequest),
          req.sabreRestToken
        )
        sabreRes = sabreRes.data.groupedItineraryResponse
        let flights = makeSabreFlightsData(sabreRes, req.currency, 1)

        let sumPrice = 0
        flights.forEach(flight => {
          sumPrice += Number(flight.price)
        })

        let averageFlightPrice = Math.round(Number(sumPrice / flights.length))
        averageFlightPrice = roundPriceWithMarkup(
          averageFlightPrice,
          req.currency,
          req.markupOptions.flight.value
        )
        // compare averagePrice with company policy
        if (policy.setFlightLimit && averageFlightPrice > policy.flightLimit) {
          req.trip.budgetPassengers[0].flight.price = policy.flightLimit
        } else {
          req.trip.budgetPassengers[0].flight.price = averageFlightPrice
        }

        // in case price still equal to 0
        if (req.trip.budgetPassengers[0].flight.price === 0) {
          req.trip.budgetPassengers[0].flight.price = policy.flightLimit
        }
      } catch (error) {
        if (policy.setFlightLimit) {
          req.trip.budgetPassengers[0].flight.price = policy.flightLimit
        } else {
          req.trip.budgetPassengers[0].flight.price = 0
        }
      }

      req.trip.budgetPassengers[0].totalPrice +=
        req.trip.budgetPassengers[0].flight.price
    } // end flight budget

    // hotel budget
    if (req.trip.budgetPassengers[0].lodging.selected) {
      req.trip.budgetPassengers[0].lodging.class = policy.hotelClass
      //  Calculate Hotel budget
      let request = {
        stay: {
          checkIn: budget.lodging.checkInDate,
          checkOut: budget.lodging.checkOutDate
        },
        occupancies: [
          {
            rooms: 1,
            adults: 1,
            children: 0
          }
        ],
        geolocation: {
          latitude: budget.lodging.regionCoordinates[0],
          longitude: budget.lodging.regionCoordinates[1],
          radius: 8,
          unit: 'km'
        },
        filter: {
          paymentType: 'AT_WEB'
        }
      }

      try {
        let responseHotel = await htbApi.getRooms(request)
        let { data } = responseHotel
        let hotelInfoList = _.get(data, 'hotels.hotels', [])
        hotelInfoList = hotelInfoList.filter(
          hotel => parseInt(hotel.categoryCode.charAt(0)) === policy.hotelClass
        )

        let sumPriceHotelRoom = 0
        hotelInfoList.forEach(hotel => {
          sumPriceHotelRoom += Number(hotel.minRate * req.currency.rate)
        })

        let averageHotelPrice = Math.round(
          Number(sumPriceHotelRoom / hotelInfoList.length)
        )
        averageHotelPrice = roundPriceWithMarkup(
          averageHotelPrice,
          req.currency,
          req.markupOptions.hotel.value
        )

        // compare averagePrice with company policy
        if (policy.setHotelLimit && averageHotelPrice > policy.hotelLimit) {
          req.trip.budgetPassengers[0].lodging.price = policy.hotelLimit
        } else {
          req.trip.budgetPassengers[0].lodging.price = averageHotelPrice
        }
        // in case price still equal to 0
        if (req.trip.budgetPassengers[0].lodging.price === 0) {
          req.trip.budgetPassengers[0].lodging.price = policy.hotelLimit
        }
      } catch (error) {
        // case suppliers don't return data
        if (policy.setHotelLimit) {
          req.trip.budgetPassengers[0].lodging.price = policy.hotelLimit
        } else {
          req.trip.budgetPassengers[0].lodging.price = 0
        }
      }
      req.trip.budgetPassengers[0].totalPrice +=
        req.trip.budgetPassengers[0].lodging.price
    }

    //Update req.trip information
    req.trip.budgetPassengers[0].totalPrice = Number(
      req.trip.budgetPassengers[0].totalPrice
    )

    await Trip.findByIdAndUpdate(req.trip._id, {
      $set: {
        isBudgetUpdated: true,
        budgetPassengers: req.trip.budgetPassengers
      }
    })
  } catch (error) {}
  next()
}

const createTripExpense = async (req, res, next) => {
  if (
    req.body.status === 'approved' &&
    _.get(req, 'body.budgetPassengers[0].meal.selected', false) === true
  ) {
    const expense = new Expense()
    expense._creator = req.trip._creator
    expense.amount = req.body.budgetPassengers[0].meal.price
    expense.rawAmount = req.body.budgetPassengers[0].meal.price
    expense.currency = req.trip.currency
    expense.rawCurrency = req.trip.currency
    expense.category = 'meal'
    expense.transactionDate = req.trip.startDate
    expense._trip = req.trip._id
    expense._company = req.user._company
    expense.account = 'cash'
    await expense.save()
  }
  next()
}

const updateTripExpenseStatus = async (req, res, next) => {
  console.log('updateExpenseStatus: ', req.tripIds)
  if (!_.isEmpty(req.tripIds)) {
    req.tripIds.forEach(async tripId => {
      await updateExpenseStatus(tripId)
    })
  }
  next()
}

async function updateExpenseStatus(tripId) {
  let expensesStatus = ''
  let expesnes = await Expense.find({
    _trip: tripId
  })
  console.log('expesnes: ', expesnes, _.isEmpty(expesnes))
  if (_.isEmpty(expesnes)) {
    // trip does not have any expense
    expensesStatus = 'empty'
  } else if (!_.isEmpty(expesnes.filter(e => e.status === 'claiming'))) {
    // trip have at least one claiming expense
    expensesStatus = 'claiming'
  } else if (!_.isEmpty(expesnes.filter(e => e.status === 'rejected'))) {
    // trip have at least one rejected expense
    expensesStatus = 'rejected'
  } else if (!_.isEmpty(expesnes.filter(e => e.status === 'waiting'))) {
    // trip have at least one claiming expense
    expensesStatus = 'draft'
  } else {
    expensesStatus = 'approved'
  }
  return Trip.findByIdAndUpdate(
    {
      _id: tripId
    },
    {
      $set: {
        expensesStatus
      }
    },
    { new: true }
  )
    .then()
    .catch()
}

module.exports = {
  calculateBudget,
  updateTripExpenseStatus,
  createTripExpense
}
