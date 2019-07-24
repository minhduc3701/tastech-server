const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const {
  makeHotelbedsHotelsData,
  makeHotelbedsRoomsData
} = require('../../modules/utils')
const { hotelbedsCurrencyExchange } = require('../../middleware/currency')

router.post('/hotels', hotelbedsCurrencyExchange, async (req, res) => {
  try {
    // get available hotelbeds rooms
    let { roomRequest } = req.body
    // let hotelbedsRoomsRes = await api.getRooms(roomRequest)
    let hotelbedsRoomsRes = {
      data: {
        auditData: {},
        hotels: {
          hotels: [
            {
              code: 1,
              name: 'Occidental Playa de Palma',
              categoryCode: '4EST',
              categoryName: '4 STARS',
              destinationCode: 'PMI',
              destinationName: 'Majorca',
              zoneCode: 20,
              zoneName: 'Playa de Palma',
              latitude: '39.516336',
              longitude: '2.749349',
              rooms: [
                {
                  code: 'APT.C4',
                  name: 'APARTMENT CAPACITY 4',
                  rates: [
                    {
                      rateKey:
                        '20181115|20181116|H|1|297|APT.C4|OFE-BAJABB|BB||1~2~2|2~4|N@11CEE8B87CE54ECDB91F4F7D19E455C81155',
                      rateClass: 'NOR',
                      rateType: 'BOOKABLE',
                      net: '99.36',
                      sellingRate: '110.40',
                      hotelSellingRate: '110.40',
                      hotelCurrency: 'EUR',
                      hotelMandatory: true,
                      allotment: 16,
                      commission: '11.04',
                      commissionVAT: '0.00',
                      commissionPCT: '10.00',
                      paymentType: 'AT_HOTEL',
                      packaging: false,
                      boardCode: 'BB',
                      boardName: 'BED AND BREAKFAST',
                      cancellationPolicies: [
                        {
                          amount: '55.20',
                          hotelAmount: '55.20',
                          hotelCurrency: 'EUR',
                          from: '2018-11-07T23:59:00+01:00'
                        }
                      ],
                      rooms: 1,
                      adults: 2,
                      children: 2,
                      childrenAges: '2,4',
                      promotions: [
                        {
                          code: '042',
                          name: 'Special Offer',
                          remark: 'Special offer . Special offer'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }

    let hotelbedsRoomsData = makeHotelbedsRoomsData(
      hotelbedsRoomsRes.data.hotels.hotels,
      req.currency
    )

    // get appropriate hotelbeds hotel content, merge to available hotels
    let hotelIds = hotelbedsRoomsRes.data.hotels.hotels.map(hotel => hotel.code)
    const queryString = `fields=all&codes=${hotelIds.join(',')}&from=1&to=${
      hotelIds.length
    }`
    // let hotelbedsHotelsRes = await api.getHotels(queryString)
    let hotelbedsHotelsRes = {
      data: {
        from: 1,
        to: 100,
        total: 183524,
        auditData: {
          processTime: '399',
          timestamp: '2019-05-13 05:21:23.589',
          requestHost: '10.185.83.17',
          serverId:
            'ip-10-185-91-230.eu-west-1.compute.internal.node.int-hbg-aws-eu-west-1.discovery',
          environment: '[awseuwest1, awseuwest1b, ip_10_185_91_230]',
          release: '371f67f890abd06c354e9e632d438368bcab9cf9'
        },
        hotels: [
          {
            code: 1,
            name: {
              content: 'Ohtels Villa Dorada'
            },
            description: {
              content:
                'This hotel is located about 150 metres from the fine sandy beach. The lively centre of Cambrils is approximately 10 km away and can be easily reached by the public bus services. There is a stop for public transport right in front of the hotel. The immediate vicinity offers a diverse range of shopping and entertainment facilities including boutiques, restaurants and bars. This hotel comprises a total of 260 rooms spread over 5 floors. Dining options include a café, a bar and an air-conditioned buffet restaurant with highchairs for infants. The tastefully decorated, cosy rooms come with a balcony and satellite TV.'
            },
            countryCode: 'ES',
            stateCode: '43',
            destinationCode: 'SAL',
            zoneCode: 10,
            coordinates: {
              longitude: 1.152529,
              latitude: 41.068407
            },
            categoryCode: '3EST',
            categoryGroupCode: 'GRUPO3',
            chainCode: 'OHTEL',
            accommodationTypeCode: 'HOTEL',
            boardCodes: ['BB', 'AI', 'HB', 'FB', 'RO'],
            segmentCodes: [37],
            address: {
              content: 'Carrer Del Vendrell,11  '
            },
            postalCode: '43840',
            city: {
              content: 'SALOU'
            },
            email: 'comercial@ohtels.es',
            license: 'HT-000473',
            facilities: [
              {
                facilityCode: 70,
                facilityGroupCode: 10,
                order: 1,
                indYesOrNo: false,
                number: 260,
                voucher: false
              },
              {
                facilityCode: 50,
                facilityGroupCode: 10,
                order: 1,
                number: 5,
                voucher: false
              },
              {
                facilityCode: 90,
                facilityGroupCode: 10,
                order: 1,
                number: 250,
                voucher: false
              },
              {
                facilityCode: 95,
                facilityGroupCode: 10,
                order: 1,
                number: 10,
                voucher: false
              },
              {
                facilityCode: 56,
                facilityGroupCode: 10,
                order: 1,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 10,
                facilityGroupCode: 20,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 50,
                facilityGroupCode: 30,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 60,
                facilityGroupCode: 30,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 10,
                facilityGroupCode: 40,
                order: 1,
                distance: 300,
                voucher: false
              },
              {
                facilityCode: 145,
                facilityGroupCode: 40,
                order: 1,
                distance: 1000,
                voucher: false
              },
              {
                facilityCode: 20,
                facilityGroupCode: 40,
                order: 1,
                distance: 15000,
                voucher: false
              },
              {
                facilityCode: 80,
                facilityGroupCode: 40,
                order: 2,
                distance: 101000,
                voucher: false
              },
              {
                facilityCode: 40,
                facilityGroupCode: 40,
                order: 1,
                distance: 150,
                voucher: false
              },
              {
                facilityCode: 130,
                facilityGroupCode: 40,
                order: 1,
                distance: 2000,
                voucher: false
              },
              {
                facilityCode: 125,
                facilityGroupCode: 40,
                order: 1,
                distance: 1,
                voucher: false
              },
              {
                facilityCode: 295,
                facilityGroupCode: 60,
                order: 1,
                indYesOrNo: true,
                number: 12,
                voucher: false
              },
              {
                facilityCode: 298,
                facilityGroupCode: 60,
                order: 1,
                indYesOrNo: true,
                number: 1,
                voucher: false
              },
              {
                facilityCode: 10,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 260,
                facilityGroupCode: 60,
                order: 1,
                indYesOrNo: true,
                voucher: false
              },
              {
                facilityCode: 20,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 30,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 261,
                facilityGroupCode: 60,
                order: 1,
                indFee: false,
                indYesOrNo: true,
                voucher: false
              },
              {
                facilityCode: 100,
                facilityGroupCode: 60,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 55,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 170,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 190,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 200,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 230,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 240,
                facilityGroupCode: 60,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 250,
                facilityGroupCode: 60,
                order: 1,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 287,
                facilityGroupCode: 60,
                order: 1,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 275,
                facilityGroupCode: 60,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 264,
                facilityGroupCode: 60,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 535,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 540,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 295,
                facilityGroupCode: 70,
                order: 1,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 320,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: true
              },
              {
                facilityCode: 330,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: false,
                voucher: false
              },
              {
                facilityCode: 30,
                facilityGroupCode: 70,
                order: 1,
                indYesOrNo: true,
                voucher: false
              },
              {
                facilityCode: 260,
                facilityGroupCode: 70,
                order: 1,
                timeFrom: '14:00:00',
                timeTo: '00:00:00',
                voucher: true
              },
              {
                facilityCode: 390,
                facilityGroupCode: 70,
                order: 1,
                timeFrom: '07:00:00',
                timeTo: '10:00:00',
                voucher: false
              },
              {
                facilityCode: 564,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 240,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 250,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: true,
                voucher: false
              },
              {
                facilityCode: 550,
                facilityGroupCode: 70,
                order: 1,
                indFee: false,
                indYesOrNo: true,
                voucher: false
              },
              {
                facilityCode: 290,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 50,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 70,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 125,
                facilityGroupCode: 70,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 80,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 130,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 220,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 230,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 555,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 575,
                facilityGroupCode: 71,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 363,
                facilityGroupCode: 73,
                order: 1,
                number: 1,
                voucher: false
              },
              {
                facilityCode: 395,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 400,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 350,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 401,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 405,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 193,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 150,
                facilityGroupCode: 73,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 420,
                facilityGroupCode: 74,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 30,
                facilityGroupCode: 80,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 50,
                facilityGroupCode: 80,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 80,
                facilityGroupCode: 80,
                order: 1,
                indLogic: true,
                voucher: false
              },
              {
                facilityCode: 90,
                facilityGroupCode: 90,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 260,
                facilityGroupCode: 90,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 270,
                facilityGroupCode: 90,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              },
              {
                facilityCode: 350,
                facilityGroupCode: 90,
                order: 1,
                indLogic: true,
                indFee: false,
                voucher: false
              }
            ]
          }
        ]
      }
    }

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
        hotels: hotelbedsHotelsData
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/hotels/:id', (req, res) => {
  const hotelCode = req.params.id
  api
    .getHotelDetail(hotelCode)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/rooms', hotelbedsCurrencyExchange, (req, res) => {
  const request = req.body
  api
    .getRooms(request)
    .then(response => {
      if (response.data) {
        hotelbedsHotelsData = makeHotelbedsRoomsData(
          response.data.hotels.hotels,
          req.currency
        )
        res.status(200).send({
          hotels: hotelbedsHotelsData
        })
      }
    })
    .catch(error => {
      res.status(400).send({ message: '404 Bad request' })
    })
})

router.post('/checkRate', (req, res) => {
  const request = req.body
  api
    .checkRate(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/bookings', (req, res) => {
  const request = req.body
  api
    .createHotelbedsOrder(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ data: response.data })
      }
    })
    .catch(error => {
      res.status(400).send(error.response.data)
    })
})

module.exports = router
