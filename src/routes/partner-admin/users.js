const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const _ = require('lodash')

router.post('/search', (req, res) => {
  let email = _.toLower(_.trim(req.body.email))
  User.find({
    _partner: req.user._partner,
    _id: { $ne: req.user._id },
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
      console.log(e)
      res.status(400).send()
    })
  // @see https://stackoverflow.com/questions/3305561/how-to-query-mongodb-with-like
  // @see https://stackoverflow.com/questions/26699885/how-can-i-use-a-regex-variable-in-a-query-for-mongodb
})

module.exports = router
