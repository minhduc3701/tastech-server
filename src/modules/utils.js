const _ = require('lodash')
const moment = require('moment')
const mapClassOptions = {
  Y: 'ECONOMY',
  S: 'PREMIUM ECONOMY',
  C: 'BUSINESS',
  F: 'FIRST CLASS'
}
const makeSegmentsData = segment => {
  let data = _.pick(segment, [
    'airline',
    'arrival',
    'bookingCode',
    'departure',
    'flightNum'
  ])

  return {
    ...data,
    arrivalDate: segment.strArrivalDate,
    arrivalTime: segment.strArrivalTime,
    departureDate: segment.strDepartureDate,
    departureTime: segment.strDepartureTime
  }
}

const makeRoomGuestDetails = (passengers, numberOfRoom) => {
  let roomGuestDetails = []
  let countAdult = 0
  let pi = 0
  let ri = 0

  do {
    let passenger = passengers[pi]
    let passengerInfo = {
      gender: passenger.title === 'mr' ? 2 : 1,
      firstName: removeSpaces(passenger.firstName),
      lastName: removeSpaces(passenger.lastName)
    }

    if (!roomGuestDetails[ri]) {
      roomGuestDetails[ri] = {
        guestInfos: [passengerInfo]
      }
    } else {
      roomGuestDetails[ri].guestInfos.push(passengerInfo)
    }

    countAdult++
    pi++
    ri++

    if (ri === numberOfRoom) {
      ri = 0
    }
  } while (countAdult < passengers.length)

  return roomGuestDetails
}

const removeSpaces = str => _.replace(str, /\s+/g, '')

const makeFlightsData = (data, { isRoundTrip, currency, numberOfAdults }) => {
  let flightsData = []
  if (data) {
    data.solutions.forEach(solution => {
      let departureFlights = data.flights.filter(
        flight =>
          solution.journeys.journey_0.findIndex(
            flightId => flightId === flight.flightId
          ) >= 0
      )
      let departureFlight = departureFlights[0]

      let departureSegments = []
      let departureSegmentIds = departureFlight.segmengtIds
      departureSegmentIds.forEach(id => {
        let segmentIndex = data.segments.findIndex(
          segment => segment.segmentId === id
        )
        let segment = data.segments[segmentIndex]
        departureSegments.push(segment)
      })

      let returnFlight = {}
      let returnSegments = []
      if (isRoundTrip) {
        // return flight
        let returnFlights = data.flights.filter(
          flight =>
            solution.journeys.journey_1.findIndex(
              flightId => flightId === flight.flightId
            ) >= 0
        )
        returnFlight = returnFlights[0]

        let returnSegmentIds = returnFlight.segmengtIds
        returnSegmentIds.forEach(id => {
          let segmentIndex = data.segments.findIndex(
            segment => segment.segmentId === id
          )
          let segment = data.segments[segmentIndex]
          returnSegments.push(segment)
        })
      }

      let adultPriceBreakdown = ['adtFare', 'adtTax', 'tktFee']

      let serviceFeeBreadkdown = ['platformServiceFee', 'merchantFee']

      let adultPrice = adultPriceBreakdown.reduce(
        (acc, fee) => solution[fee] + acc,
        0
      )
      let serviceFee = serviceFeeBreadkdown.reduce(
        (acc, fee) => solution[fee] + acc,
        0
      )

      let price = (adultPrice + serviceFee) * currency.rate
      let rawTotalPrice = adultPrice * numberOfAdults + serviceFee
      let totalPrice = rawTotalPrice * currency.rate

      flightsData.push({
        ...solution,
        currency: currency.code,
        rawCurrency: solution.currency,
        price,
        totalPrice,
        rawTotalPrice,
        departureFlight,
        departureSegments,
        returnFlight,
        returnSegments,
        supplier: 'pkfare'
      })
    })
  }
  flightsData = _.sortBy(flightsData, ['price'])
  return flightsData
}

const makeSabreFlightsData = (itineraryGroups, sabreRes, req) => {
  let flights = []
  itineraryGroups.map(l => {
    l.itineraries.map(i => {
      let obj = {
        legs: i.legs
      }
      obj.departureDescs = sabreRes.legDescs.find(
        leg => leg.id === i.legs[0].ref
      )
      obj.departureSegments = []
      obj.departureDescs.schedules.map((s, index) => {
        let cabinCode =
          i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
            .fareComponents[index].segments[0].segment.cabinCode
        let cabinClass = mapClassOptions[cabinCode]
        let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
        obj.departureSegments.push({
          id: data.id,
          cabinClass,
          departure: data.departure.airport,
          arrival: data.arrival.airport,
          strDepartureTime: data.departure.time.substring(0, 5),
          strArrivalTime: data.arrival.time.substring(0, 5),
          flightNum: data.carrier.marketingFlightNumber,
          flightTime: moment(data.arrival.time.substring(0, 5), 'hh:mm').diff(
            moment(data.departure.time.substring(0, 5), 'hh:mm'),
            'minutes'
          ),
          airline: data.carrier.marketing
        })
      })
      obj.departureFlight = {
        flightId: ''
      }
      obj.departureSegments.forEach(s => {
        if (obj.departureFlight.flightId === '') {
          obj.departureFlight.flightId += `${s.flightNum}-${s.airline}`
        } else {
          obj.departureFlight.flightId += `-${s.flightNum}-${s.airline}`
        }
      })

      obj.returnDescs = {}
      obj.returnSegments = []
      obj.returnFlight = {}
      if (i.legs.length === 2) {
        obj.returnDescs = sabreRes.legDescs.find(
          leg => leg.id === i.legs[1].ref
        )
        obj.returnSegments = []
        obj.returnDescs.schedules.map((s, index) => {
          let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
          let cabinCode =
            i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
              .fareComponents[obj.departureSegments.length + index - 1]
              .segments[0].segment.cabinCode
          let cabinClass = mapClassOptions[cabinCode]
          obj.returnSegments.push({
            id: data.id,
            cabinClass,
            departure: data.departure.airport,
            arrival: data.arrival.airport,
            strDepartureTime: data.departure.time.substring(0, 5),
            strArrivalTime: data.arrival.time.substring(0, 5),
            flightNum: data.carrier.marketingFlightNumber,
            flightTime: moment(data.arrival.time.substring(0, 5), 'hh:mm').diff(
              moment(data.departure.time.substring(0, 5), 'hh:mm'),
              'minutes'
            ),
            airline: data.carrier.marketing
          })
        })
        obj.returnFlight = {
          flightId: ''
        }
        obj.returnSegments.forEach(s => {
          if (obj.returnFlight.flightId === '') {
            obj.returnFlight.flightId += `${s.flightNum}-${s.airline}`
          } else {
            obj.returnFlight.flightId += `-${s.flightNum}-${s.airline}`
          }
        })
      }
      obj.rawCurrency = i.pricingInformation[0].fare.totalFare.currency
      obj.rawTotalPrice = i.pricingInformation[0].fare.totalFare.totalPrice
      obj.currency = req.currency.code
      obj.totalPrice = obj.rawTotalPrice * req.currency.rate
      obj.price = obj.rawTotalPrice * req.currency.rate
      obj.supplier = 'sabre'

      flights.push(obj)
    })
  })
  return flights
}

const makeHotelbedsHotelsData = (hotelbedsHotels, hotelbedsRooms, currency) => {
  return hotelbedsRooms.map(hotelRooms => {
    let matchingHotel = hotelbedsHotels.find(
      hotel => hotel.code === hotelRooms.code
    )

    if (matchingHotel) {
      const images = _.get(matchingHotel, 'images', []).map(image => {
        let newImage = {
          ...image,
          url: 'http://photos.hotelbeds.com/giata/bigger/' + image.path
        }
        return newImage
      })

      return {
        hotelId: matchingHotel.code,
        name: matchingHotel.name.content,
        starRating: parseInt(matchingHotel.categoryCode.charAt(0)),
        country: matchingHotel.countryCode,
        cityName: matchingHotel.city.content,
        address: matchingHotel.address.content,
        zip: matchingHotel.postalCode,
        longitude: matchingHotel.coordinates.longitude,
        latitude: matchingHotel.coordinates.latitude,
        summary: matchingHotel.description.content,
        description: matchingHotel.description.content,
        amenities: [],
        policies: [],
        transportations: [],
        images: images,
        lowestPrice: hotelRooms.lowestPrice,
        ratePlans: hotelRooms.ratePlans,
        supplier: 'hotelbeds',
        currency: currency.code
      }
    }
    return null
  })
}

const makeHotelbedsRoomsData = (hotels, currency) => {
  return hotels.map(hotel => {
    const rooms = []
    hotel.rooms.forEach(room => {
      room.rates
        .filter(rate => rate.paymentType === 'AT_WEB')
        .forEach(rate => {
          rooms.push({
            paymentType: rate.paymentType,
            ratePlanCode: room.rateKey,
            roomCode: room.code,
            roomName: room.name,
            currency: currency.code,
            rawCurrency: hotel.currency,
            totalPrice: Number(rate.net) * currency.rate,
            rawTotalPrice: rate.net,
            cancelRules: rate.cancellationPolicies,
            ratePlanCode: rate.rateKey,
            boardName: rate.boardName,
            bedTypes: []
          })
        })
    })
    const lowestPrice = Number(hotel.minRate) * currency.rate
    const highestPrice = Number(hotel.maxRate) * currency.rate

    return {
      ...hotel,
      currency: currency.code,
      lowestPrice,
      highestPrice,
      ratePlans: {
        bedTypeList: [],
        ratePlanList: rooms
      }
    }
  })
}

module.exports = {
  makeSegmentsData,
  makeSabreFlightsData,
  makeRoomGuestDetails,
  removeSpaces,
  makeFlightsData,
  makeHotelbedsHotelsData,
  makeHotelbedsRoomsData
}
