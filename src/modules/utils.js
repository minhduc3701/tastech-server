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
const getSegmentForFlight = (fareComponents, index) => {
  try {
    let startIndex = 0
    for (let i = 0; i < fareComponents.length; i++) {
      for (let j = 0; j < fareComponents[i].segments.length; j++) {
        if (startIndex + j === index) {
          let cabinClass =
            mapClassOptions[fareComponents[i].segments[j].segment.cabinCode]
          let seatsAvailable =
            fareComponents[i].segments[j].segment.seatsAvailable
          // console.log("cabinClass: ", cabinClass)

          return { cabinClass, seatsAvailable }
          // return cabinClass
        }
      }
      startIndex += fareComponents[i].segments.length
    }
    console.log('ko tim dc')
    return 'ktd'
  } catch (error) {
    console.log('error')
    return ' aaa '
  }
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
      // console.log(i)
      // console.log("schedules: ", obj.departureDescs.schedules)
      // console.log("schedules - length: ", obj.departureDescs.schedules.length)
      // console.log("fareComponents - length: ", i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo.fareComponents.length)
      // console.log("fareComponents: ", i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo.fareComponents)
      obj.departureDescs.schedules.map((s, index) => {
        // let cabinCode =
        //   i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
        //     .fareComponents[index].segments[0].segment.cabinCode
        // let cabinClass = mapClassOptions[cabinCode]
        // let cabinClass = 'ECONOMY'
        let cabinClass = getSegmentForFlight(
          i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
            .fareComponents,
          index
        ).cabinClass
        console.log('===========after do function: ')

        let seatsAvailable = getSegmentForFlight(
          i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
            .fareComponents,
          index
        ).seatsAvailable
        console.log('cabinClass:', cabinClass)
        console.log('seatsAvailable:', seatsAvailable)
        let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
        let toDayText = moment().format('YYYY-MM-DDT')
        let nextDayText = moment()
          .add(1, 'days')
          .format('YYYY-MM-DDT')
        let flightTime = moment
          .utc(`${toDayText}${data.arrival.time}`)
          .diff(moment.utc(`${toDayText}${data.departure.time}`), 'minutes')
        if (flightTime < 0) {
          flightTime = moment
            .utc(`${nextDayText}${data.arrival.time}`)
            .diff(moment.utc(`${toDayText}${data.departure.time}`), 'minutes')
        }
        obj.departureSegments.push({
          id: data.id,
          cabinClass,
          departure: data.departure.airport,
          arrival: data.arrival.airport,
          strDepartureTime: data.departure.time.substring(0, 5),
          strArrivalTime: data.arrival.time.substring(0, 5),
          flightNum: data.carrier.marketingFlightNumber,
          flightTime,
          seatsAvailable,
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
          let cabinClass = getSegmentForFlight(
            i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
              .fareComponents,
            index + obj.departureDescs.schedules.length
          ).cabinClass
          let seatsAvailable = getSegmentForFlight(
            i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
              .fareComponents,
            index + obj.departureDescs.schedules.length
          ).seatsAvailable
          console.log('cabinClass:', cabinClass)
          console.log('seatsAvailable:', seatsAvailable)
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
            seatsAvailable,
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

const makeHotelbedsHotelsData = (
  hotelbedsHotels,
  hotelbedsRooms,
  currency,
  hotelFacilities,
  hotelFacilityGroups
) => {
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

      let facilitites = _.get(matchingHotel, 'facilities', []).map(facility => {
        let matchingFacility = hotelFacilities.find(
          hotelFacility => hotelFacility.code === facility.facilityCode
        )
        let matchingGroup = hotelFacilityGroups.find(
          group => group.code === facility.facilityGroupCode
        )

        let facilityName = matchingFacility.description.content
        if (facility.number > 0) {
          facilityName += ': ' + facility.number
        }

        if (matchingFacility.description.content !== '1') {
          return {
            ...facility,
            groupName: matchingGroup.description.content,
            name: facilityName
          }
        } else return null
      })
      facilitites = facilitites.filter(facility => facility !== null)

      let transportations = _.get(matchingHotel, 'interestPoints', []).map(
        point => {
          return `${point.poiName} - ${point.distance} meters`
        }
      )

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
        amenities: facilitites,
        policies: [],
        transportations: transportations,
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
