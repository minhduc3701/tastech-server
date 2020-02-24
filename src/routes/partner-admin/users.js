const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const _ = require('lodash')
const Trip = require('../../models/trip')
const Company = require('../../models/company')

const { validateUserIdPartner } = require('../../middleware/users')
const { ObjectID } = require('mongodb')

router.post('/search', (req, res) => {
  let email = _.toLower(_.trim(req.body.email))
  User.find({
    _partner: req.user._partner,
    $or: [
      {
        email: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      },
      {
        firstName: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      },
      {
        lastName: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      }
    ]
  })
    .limit(50)
    .then(users => {
      users = users.map(user =>
        _.omit(user.toJSON(), [
          'preferenceFlight',
          'preferenceHotel',
          'favoriteHotels',
          'passports'
        ])
      )
      res.status(200).send({ users })
    })
    .catch(e => {
      res.status(400).send()
    })
  // @see https://stackoverflow.com/questions/3305561/how-to-query-mongodb-with-like
  // @see https://stackoverflow.com/questions/26699885/how-can-i-use-a-regex-variable-in-a-query-for-mongodb
})

// respone company tour code for user id
router.get('/:id/tour-code', validateUserIdPartner, function(req, res, next) {
  Company.findById({
    _id: req.userPartner._company
  })
    .then(company =>
      res.status(200).send({ tourCodes: _.get(company, 'tourCodes', []) })
    )
    .catch(e => res.status(400).send())
})

// response approved trips for booking
router.get('/:id/trips/booking', validateUserIdPartner, async (req, res) => {
  try {
    let trips = await Trip.find({
      _company: req.userPartner._company,
      _creator: req.userPartner._id,
      businessTrip: true,
      archived: false,
      $or: [{ status: 'approved' }, { status: 'ongoing' }],
      endDate: { $gte: Date.now() }
    })
    let tripsSpend = await Trip.aggregate([
      {
        $match: {
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

    trips = trips.map(trip => {
      let foundSpend = tripsSpend.find(
        ts => ts._id.toHexString() === trip._id.toHexString()
      )
      foundSpend = foundSpend || {
        totalFlightSpend: 0,
        totalHotelSpend: 0
      }

      return {
        ...trip.toObject(),
        ...foundSpend
      }
    })

    res.status(200).send({ trips })
  } catch (e) {
    res.status(400).send()
  }
})

//get booking request by UserId
router.get('/:id/booking-request', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let objFind = {
    _creator: req.params.id,
    _partner: req.user._partner,
    isBookedByPartner: true,
    status: { $in: ['ongoing', 'approved'] }
  }
  Trip.find(objFind)
    .populate('_creator')
    .populate('_company')
    .then(trips => {
      let requests = []
      trips.map(trip => {
        _.get(trip, 'requestBookOnBehalfs', []).map(r => {
          if (r.status === 'waiting') {
            requests.push({
              _id: `${trip._id}-${r.type}`,
              ...r,
              _creator: trip._creator,
              _company: {
                _id: trip._company._id,
                name: trip._company.name
              },
              _trip: trip
            })
          }
        })
      })
      res.status(200).send({ requests })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

module.exports = router
