const _ = require('lodash')
const moment = require('moment')
const { logger } = require('../config/winston')
const validator = require('validator')
const { USD, VND, SGD, IDR } = require('../config/currency')

const hotelAccomodations = [
  { code: 'APARTMENT', text: 'Apartment' },
  { code: 'APTHOTEL', text: 'Aparthotel' },
  { code: 'CAMPING', text: 'Camping' },
  { code: 'HOMES', text: 'Villa' },
  { code: 'HOSTEL', text: 'Hostel' },
  { code: 'HOTEL', text: 'Hotel' },
  { code: 'PENDING', text: 'Pending Category' },
  { code: 'RESORT', text: 'Resort' },
  { code: 'RURAL', text: 'Rural' }
]

const getImageUri = uriString => {
  if (
    uriString &&
    !validator.isURL(_.toString(uriString), { require_protocol: true })
  ) {
    return process.env.AWS_S3_URI + '/' + uriString
  }

  return uriString
}

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
const getSegmentForSabreFlight = (fareComponents, index) => {
  let startIndex = 0
  for (let i = 0; i < fareComponents.length; i++) {
    for (let j = 0; j < fareComponents[i].segments.length; j++) {
      if (startIndex + j === index) {
        let cabinCode = fareComponents[i].segments[j].segment.cabinCode
        let bookingCode = fareComponents[i].segments[j].segment.bookingCode
        let cabinClass = mapClassOptions[cabinCode]
        let seatsAvailable =
          fareComponents[i].segments[j].segment.seatsAvailable
        return { cabinClass, seatsAvailable, cabinCode, bookingCode }
      }
    }
    startIndex += fareComponents[i].segments.length
  }
}
const getBaggageForSabreFlight = (baggageInformation, index) => {
  let startIndex = 0
  for (let i = 0; i < baggageInformation.length; i++) {
    for (let j = 0; j < baggageInformation[i].segments.length; j++) {
      if (startIndex + j === index) {
        return baggageInformation[i].allowance.ref
      }
    }
    startIndex += baggageInformation[i].segments.length
  }
}
const makeSabreFlightsData = (sabreRes, currency, numberOfPassengers) => {
  let flights = []
  try {
    let { itineraryGroups } = sabreRes

    // logger.info('sabreRes: ', sabreRes)
    itineraryGroups.map(l => {
      let departureDate = moment(
        l.groupDescription.legDescriptions[0].departureDate
      ).format('YYYY-MM-DD')
      l.itineraries.map(i => {
        let obj = {
          legs: i.legs
        }
        obj.refundable = !i.pricingInformation[0].fare.passengerInfoList[0]
          .passengerInfo.nonRefundable
        // check baggage allowance
        obj.baggageAllowance = true
        let {
          baggageInformation
        } = i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
        for (let index = 0; index < baggageInformation.length; index++) {
          if (baggageInformation[index].provisionType !== 'A') {
            obj.baggageAllowance = false
            break
          }
        }

        obj.departureDescs = sabreRes.legDescs.find(
          leg => leg.id === i.legs[0].ref
        )
        obj.departureSegments = []
        obj.departureDescs.schedules.map((s, index) => {
          let segmentInfor = getSegmentForSabreFlight(
            i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
              .fareComponents,
            index
          )
          let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)

          // calculate flight time
          let dateAdjustment = _.get(data.arrival, 'dateAdjustment', 0)
          let toDayText = moment().format('YYYY-MM-DDT')
          let flightTime = ''

          if (dateAdjustment === 0) {
            flightTime = moment
              .utc(`${toDayText}${data.arrival.time}`)
              .diff(moment.utc(`${toDayText}${data.departure.time}`), 'minutes')
          } else {
            let arrivalDayText = moment()
              .add(dateAdjustment, 'days')
              .format('YYYY-MM-DDT')
            flightTime = moment
              .utc(`${arrivalDayText}${data.arrival.time}`)
              .diff(moment.utc(`${toDayText}${data.departure.time}`), 'minutes')
          }

          let arrivalDate = moment(departureDate)
            .add(dateAdjustment, 'days')
            .format('YYYY-MM-DD')
          let baggageInfor = false
          if (obj.baggageAllowance) {
            baggageInfor = []
            let baggageDecs = sabreRes.baggageAllowanceDescs.find(
              decs =>
                decs.id ===
                getBaggageForSabreFlight(
                  i.pricingInformation[0].fare.passengerInfoList[0]
                    .passengerInfo.baggageInformation,
                  index
                )
            )
            let baggageDecsKeys = Object.keys(baggageDecs)
            if (
              baggageDecsKeys.includes('unit') &&
              baggageDecsKeys.includes('weight')
            ) {
              baggageInfor.push(
                `Up to ${baggageDecs.weight} ${baggageDecs.unit}`
              )
            }
            if (baggageDecsKeys.includes('description1')) {
              baggageInfor.push(baggageDecs.description1.toLowerCase())
            }
            if (baggageDecsKeys.includes('description2')) {
              baggageInfor.push(baggageDecs.description2.toLowerCase())
            }
          }
          let DepartureDateTime = `${departureDate}T${data.departure.time.substring(
            0,
            8
          )}`
          let ArrivalDateTime = `${arrivalDate}T${data.arrival.time.substring(
            0,
            8
          )}`
          obj.departureSegments.push({
            id: data.id,
            cabinClass: segmentInfor.cabinClass,
            departure: data.departure.airport,
            arrival: data.arrival.airport,
            baggageInfor,
            DepartureDateTime: DepartureDateTime,
            departureDate: DepartureDateTime,
            strDepartureDate: departureDate,
            strDepartureTime: data.departure.time.substring(0, 5),
            ArrivalDateTime: ArrivalDateTime,
            arrivalDate: ArrivalDateTime,
            strArrivalDate: arrivalDate,
            strArrivalTime: data.arrival.time.substring(0, 5),
            flightNum: data.carrier.marketingFlightNumber,
            flightTime,
            seatsAvailable: segmentInfor.seatsAvailable,
            cabinCode: segmentInfor.cabinCode,
            bookingCode: segmentInfor.bookingCode,
            airline: data.carrier.operating,
            marketing: data.carrier.marketing,
            marketingFlightNumber: data.carrier.marketingFlightNumber,
            operating: data.carrier.operating,
            operatingFlightNumber: data.carrier.operatingFlightNumber
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
          let departureDate = moment(
            l.groupDescription.legDescriptions[1].departureDate
          ).format('YYYY-MM-DD')
          obj.returnDescs = sabreRes.legDescs.find(
            leg => leg.id === i.legs[1].ref
          )

          obj.returnSegments = []
          obj.returnDescs.schedules.map((s, index) => {
            let data = sabreRes.scheduleDescs.find(sch => sch.id === s.ref)
            // calculate flight time
            let dateAdjustment = _.get(data.arrival, 'dateAdjustment', 0)
            let toDayText = moment().format('YYYY-MM-DDT')
            let flightTime = ''

            if (dateAdjustment === 0) {
              flightTime = moment
                .utc(`${toDayText}${data.arrival.time}`)
                .diff(
                  moment.utc(`${toDayText}${data.departure.time}`),
                  'minutes'
                )
            } else {
              let arrivalDayText = moment()
                .add(dateAdjustment, 'days')
                .format('YYYY-MM-DDT')
              flightTime = moment
                .utc(`${arrivalDayText}${data.arrival.time}`)
                .diff(
                  moment.utc(`${toDayText}${data.departure.time}`),
                  'minutes'
                )
            }

            let segmentInfor = getSegmentForSabreFlight(
              i.pricingInformation[0].fare.passengerInfoList[0].passengerInfo
                .fareComponents,
              index + obj.departureDescs.schedules.length
            )
            let arrivalDate = moment(departureDate)
              .add(dateAdjustment, 'days')
              .format('YYYY-MM-DD')
            let baggageInfor = false
            if (obj.baggageAllowance) {
              baggageInfor = []
              let baggageDecs = sabreRes.baggageAllowanceDescs.find(
                decs =>
                  decs.id ===
                  getBaggageForSabreFlight(
                    i.pricingInformation[0].fare.passengerInfoList[0]
                      .passengerInfo.baggageInformation,
                    index + obj.departureDescs.schedules.length
                  )
              )
              let baggageDecsKeys = Object.keys(baggageDecs)
              if (
                baggageDecsKeys.includes('unit') &&
                baggageDecsKeys.includes('weight')
              ) {
                baggageInfor.push(
                  `Up to ${baggageDecs.weight} ${baggageDecs.unit}`
                )
              }
              if (baggageDecsKeys.includes('description1')) {
                baggageInfor.push(baggageDecs.description1.toLowerCase())
              }
              if (baggageDecsKeys.includes('description2')) {
                baggageInfor.push(baggageDecs.description2.toLowerCase())
              }
            }
            let DepartureDateTime = `${departureDate}T${data.departure.time.substring(
              0,
              8
            )}`
            let ArrivalDateTime = `${arrivalDate}T${data.arrival.time.substring(
              0,
              8
            )}`
            obj.returnSegments.push({
              id: data.id,
              cabinClass: segmentInfor.cabinClass,
              departure: data.departure.airport,
              arrival: data.arrival.airport,
              baggageInfor,
              DepartureDateTime: DepartureDateTime,
              departureDate: DepartureDateTime,
              strDepartureDate: departureDate,
              strDepartureTime: data.departure.time.substring(0, 5),
              ArrivalDateTime: ArrivalDateTime,
              arrivalDate: ArrivalDateTime,
              strArrivalDate: arrivalDate,
              strArrivalTime: data.arrival.time.substring(0, 5),
              flightNum: data.carrier.marketingFlightNumber,
              flightTime,
              seatsAvailable: segmentInfor.seatsAvailable,
              cabinCode: segmentInfor.cabinCode,
              bookingCode: segmentInfor.bookingCode,
              airline: data.carrier.operating,
              marketing: data.carrier.marketing,
              marketingFlightNumber: data.carrier.marketingFlightNumber,
              operating: data.carrier.operating,
              operatingFlightNumber: data.carrier.operatingFlightNumber
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
        obj.currency = currency.code
        obj.totalPrice = obj.rawTotalPrice * currency.rate
        obj.price = (obj.rawTotalPrice * currency.rate) / numberOfPassengers
        obj.supplier = 'sabre'

        flights.push(obj)
      })
    })
  } catch (error) {
    console.log(error)
  }
  return flights
}

const addRoomsToHotels = (hotels, roomHotelsData, currency) => {
  return hotels.map(hotel => {
    let matchingHotel = _.get(roomHotelsData, 'hotels', []).find(
      roomHotel => roomHotel.code === hotel.hotelId
    )

    if (matchingHotel) {
      const ratePlans = makeHotelbedsRoomsRatePlans(
        matchingHotel,
        currency,
        hotel.images
      )
      return {
        ...hotel,
        lowestPrice: matchingHotel.minRate * currency.rate,
        ratePlans: ratePlans
      }
    }

    return {
      ...hotel,
      lowestPrice: 0,
      ratePlans: {
        bedTypeList: [],
        ratePlanList: []
      }
    }
  })
}

const makeHotelbedsHotelsData = (
  hotels,
  roomHotelsData,
  currency,
  hotelFacilities,
  hotelFacilityGroups
) => {
  let hotelsData = hotels.map(hotel => {
    let images = _.get(hotel, 'images', [])
    let featuredImage =
      images.find(image => image.imageTypeCode === 'GEN') || images[0]
    let featuredImageLink = featuredImage
      ? 'http://photos.hotelbeds.com/giata/xxl/' + featuredImage.path
      : ''
    let thumbnailLink = featuredImage
      ? 'http://photos.hotelbeds.com/giata/' + featuredImage.path
      : ''
    const imageLinks = images.map(image => {
      let newImage = {
        ...image,
        url: 'http://photos.hotelbeds.com/giata/bigger/' + image.path
      }
      return newImage
    })

    let facilitites = []
    if (hotelFacilities && hotelFacilityGroups) {
      _.get(hotel, 'facilities', []).forEach(facility => {
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
          let facilityItem = {
            ...facility,
            groupName: matchingGroup.description.content,
            name: facilityName
          }
          facilitites.push(facilityItem)
        }
      })
    }

    const transportations = _.get(hotel, 'interestPoints', []).map(point => {
      let pointInfo = point.poiName + ' - '
      pointInfo +=
        point.distance >= 1000
          ? point.distance / 1000 + ' km'
          : point.distance + ' m'
      return pointInfo
    })

    let accommodationTypeName = hotelAccomodations.find(
      acc => acc.code === hotel.accommodationTypeCode
    ).text

    return {
      hotelId: hotel.code,
      name: hotel.name.content,
      starRating: parseInt(hotel.categoryCode.charAt(0)),
      country: hotel.countryCode,
      cityName: hotel.city.content,
      address: hotel.address.content,
      phones: hotel.phones,
      zip: hotel.postalCode,
      longitude: hotel.coordinates.longitude,
      latitude: hotel.coordinates.latitude,
      summary: hotel.description.content,
      description: hotel.description.content,
      accommodationTypeCode: hotel.accommodationTypeCode,
      accommodationTypeName,
      amenities: facilitites,
      policies: [],
      transportations,
      featuredImage: featuredImageLink,
      thumbnail: thumbnailLink,
      images: imageLinks,
      supplier: 'hotelbeds',
      currency: currency.code
    }
  })

  hotelsData = addRoomsToHotels(hotelsData, roomHotelsData, currency)
  return hotelsData
}

const makeHotelbedsRoomsRatePlans = (hotel, currency, hotelImages) => {
  const rooms = []
  hotel.rooms.forEach(room => {
    room.rates
      .filter(rate => rate.paymentType === 'AT_WEB')
      .forEach(rate => {
        const price = rate.net
        const cancelRules = _.get(rate, 'cancellationPolicies', []).map(
          rule => {
            return {
              cancelCharge: rule.amount * currency.rate,
              from: rule.from
            }
          }
        )
        const images = hotelImages.filter(image => image.roomCode === room.code)

        rooms.push({
          paymentType: rate.paymentType,
          ratePlanCode: room.rateKey,
          roomCode: room.code,
          roomName: room.name,
          currency: currency.code,
          rawCurrency: hotel.currency,
          rawNet: rate.net,
          totalPrice: Number(price) * currency.rate,
          rawTotalPrice: rate.net,
          cancelRules: cancelRules,
          ratePlanCode: rate.rateKey,
          rateType: rate.rateType,
          boardCode: rate.boardCode,
          boardName: rate.boardName,
          bedTypes: [],
          rateClass: rate.rateClass,
          images: images
        })
      })
  })

  return {
    bedTypeList: [],
    ratePlanList: rooms
  }
}

const makeHtbRoomPaxes = (passengers, children, numberOfRoom, rateKey) => {
  let rooms = [
    {
      rateKey: rateKey,
      paxes: []
    }
  ]

  passengers.forEach((passenger, index) => {
    let passengerInfo = {
      roomId: (index % numberOfRoom) + 1,
      type: 'AD',
      name: passenger.firstName,
      surName: passenger.lastName
    }
    rooms[0]['paxes'].push(passengerInfo)
  })

  children.forEach((child, index) => {
    let childInfo = {
      roomId: (index % numberOfRoom) + 1,
      type: 'CH',
      name: child.firstName,
      surName: child.lastName
    }
    rooms[0]['paxes'].push(childInfo)
  })

  return rooms
}

const roundingAmountStripe = (amount, currency) => {
  switch (currency) {
    case USD:
    case SGD:
    case IDR:
      amount = amount * 100
      break
    case VND:
      amount = amount * 1
      break
  }
  return Math.round(amount)
}

const formatLocaleMoney = (amount, currency) => {
  let locale = 'en'

  switch (currency) {
    case 'VND':
      locale = 'vi'
      break
    case 'IDR':
      locale = 'id'
      break
  }

  if (currency === 'VND') {
    amount = Math.round(amount)
  } else {
    amount = Number((Math.round(amount * 100) / 100).toFixed(2))
  }

  return amount.toLocaleString(locale) + ' ' + currency
}

const getUserProfileStrength = user => {
  const profilePoints = {
    firstName: 5,
    lastName: 5,
    avatar: 10,
    dateOfBirth: 10,
    country: 5,
    phone: 10
  }

  const flightRefPoints = {
    homeAirport: 5,
    prefFlightSeat: 5,
    prefAirline: 5,
    prefFlightClass: 5,
    prefFlightDuration: 5
  }

  let strength = 0
  strength += user['passports'].length > 0 ? 5 : 0
  strength += _.get(user, 'preferenceFlight.prefDepartureTime.max') > 0 ? 5 : 0
  strength += _.get(user, 'preferenceFlight.prefArrivalTime.max') > 0 ? 5 : 0
  strength += _.get(user, 'preferenceHotel.prefHotelClass') ? 5 : 0

  for (let [key, value] of Object.entries(profilePoints)) {
    strength += user[key] ? value : 0
  }
  for (let [key, value] of Object.entries(flightRefPoints)) {
    strength += user['preferenceFlight'][key] ? value : 0
  }

  let isPrefFlightMealSelected = false
  let isPrefHotelFacilitySelected = false
  for (let [key, value] of Object.entries(
    user['preferenceFlight']['prefFlightMeal']
  )) {
    if (value) {
      isPrefFlightMealSelected = true
    }
  }
  for (let [key, value] of Object.entries(
    user['preferenceHotel']['prefHotelFacility']
  )) {
    if (value) {
      isPrefHotelFacilitySelected = true
    }
  }
  strength += isPrefFlightMealSelected ? 5 : 0
  strength += isPrefHotelFacilitySelected ? 5 : 0

  return strength
}

const makeUrboxGiftData = (gift, rate) => {
  return {
    giftId: gift.id,
    title: gift.title,
    image: gift.image,
    brand: gift.brand,
    brandImage: gift.brandImage,
    categoryId: gift.cat_id,
    categoryName: gift.cat_title,
    price: gift.price,
    pricePoint: Math.round(gift.price * rate),
    supplier: 'urbox',
    currency: 'VND',
    country: 'VN'
  }
}

module.exports = {
  getImageUri,
  makeSegmentsData,
  makeSabreFlightsData,
  makeRoomGuestDetails,
  makeHtbRoomPaxes,
  removeSpaces,
  makeFlightsData,
  makeHotelbedsHotelsData,
  roundingAmountStripe,
  formatLocaleMoney,
  getUserProfileStrength,
  makeUrboxGiftData
}
