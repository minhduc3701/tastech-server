const express = require('express')
const router = express.Router()
const _ = require('lodash')
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const Hotel = require('../../models/hotel')
const HotelImage = require('../../models/hotelImage')
const HotelPolicy = require('../../models/hotelPolicy')
const HotelAmenity = require('../../models/hotelAmenity')
const HotelAmenityType = require('../../models/hotelAmenityType')
const HotelDescription = require('../../models/hotelDescription')
const HotelTransportation = require('../../models/hotelTransportation')
const {
  makeHotelbedsHotelsData,
  makeHotelbedsRoomsData
} = require('../../modules/utils')

const {
  currencyExchange,
  hotelbedsCurrencyExchange
} = require('../../middleware/currency')

router.get('/hotelbeds/:id', hotelbedsCurrencyExchange, async (req, res) => {
  hotelId = req.params.id
  try {
    // get available hotelbeds rooms
    // let { roomRequest } = req.body
    let roomRequest = {
      stay: {
        checkIn: '2019-12-15',
        checkOut: '2019-12-16'
      },
      occupancies: [
        {
          rooms: 1,
          adults: 2,
          children: 0
        }
      ],
      hotels: {
        hotel: [hotelId]
      }
    }
    let hotelbedsRoomsRes = await api.getRooms(roomRequest)

    let hotelbedsRoomsData = makeHotelbedsRoomsData(
      hotelbedsRoomsRes.data.hotels.hotels,
      req.currency
    )

    // get appropriate hotelbeds hotel content, merge to available hotels
    const queryString = `fields=all&codes=${hotelId}`
    let hotelbedsHotelsRes = await api.getHotels(queryString)

    let hotelFacilityRes = await api.getFacilities()
    let hotelFacilityGroupRes = await api.getFacilityGroups()

    let hotelbedsHotelsData = makeHotelbedsHotelsData(
      hotelbedsHotelsRes.data.hotels,
      hotelbedsRoomsData,
      req.currency,
      hotelFacilityRes.data.facilities,
      hotelFacilityGroupRes.data.facilityGroups
    )

    if (hotelbedsRoomsRes.data) {
      res.status(200).send({
        hotel: hotelbedsHotelsData[0]
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/pkfare/:id', currencyExchange, async (req, res) => {
  hotelId = req.params.id

  Promise.all([
    Hotel.findOne({
      hotelId: hotelId,
      language: 'en_US'
    }),
    HotelImage.find({
      hotelId: hotelId
    }),
    HotelPolicy.find({
      hotelId: hotelId
    }),
    HotelAmenity.find({
      hotelId: hotelId
    }),
    HotelDescription.find({
      hotelId: hotelId
    }),
    HotelTransportation.find({
      hotelId: hotelId
    })
  ])
    .then(results => {
      let amenityIds = _.uniq(results[3].map(amenity => amenity.amenityId))

      return Promise.all([
        ...results,
        HotelAmenityType.find({
          amenityId: { $in: amenityIds }
        })
      ])
    })
    .then(results => {
      let hotel = results[0]
      let hotelImages = results[1]
      let hotelPolicies = results[2]
      let hotelAmenities = results[3]
      let hotelDescriptions = results[4]
      let hotelTransportations = results[5]
      let hotelAmenityTypes = results[6]

      let images = hotelImages.filter(image => image.hotelId === hotel.hotelId)
      let policies = hotelPolicies.filter(
        policy => policy.hotelId === hotel.hotelId
      )
      let amenities = hotelAmenities.filter(
        amenity => amenity.hotelId === hotel.hotelId
      )
      amenities = _.uniqBy(amenities, amenity => amenity.amenityId)
      amenities = amenities.map(amenity => {
        let type = hotelAmenityTypes.find(
          type => type.amenityId === amenity.amenityId
        )

        if (!type) {
          type = {
            groupId: 0,
            groupName: 'Others',
            groupType: 'others'
          }
        } else {
          type = type.toObject()
        }

        return {
          ...amenity.toObject(),
          ...type
        }
      })
      let descriptions = hotelDescriptions.filter(
        desc => desc.hotelId === hotel.hotelId
      )
      let summary = descriptions.find(desc => desc.type === 'LocationIntroduce')
      let description = descriptions.find(
        desc => desc.type === 'HotelIntroduce'
      )
      let transportations = hotelTransportations.filter(
        trans => trans.hotelId === hotel.hotelId
      )

      let newHotels = {
        ...hotel.toObject(),
        currency: req.currency.code,
        supplier: 'pkfare',
        images,
        policies,
        amenities,
        summary: _.get(summary, 'description'),
        description: _.get(description, 'description'),
        transportations
      }

      res.status(200).send({ hotel: newHotels })
    })
    .catch(error => {
      res.status(400).send()
    })
})

module.exports = router
