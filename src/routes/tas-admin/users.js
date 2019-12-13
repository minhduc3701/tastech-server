const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const Role = require('../../models/role')
const { createUser } = require('../../middleware/users')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', function(req, res) {
  let perPage = 20
  let page = Math.max(0, req.query.page)

  // @see https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
  Promise.all([
    User.find({
      _id: { $ne: req.user._id }, // don't show current tas-admin
      _partner: null // do not get partner's orders
    })
      .limit(perPage)
      .skip(perPage * page)
      .sort([['_id', -1]]),
    User.count({ _id: { $ne: req.user._id } })
  ])
    .then(results => {
      let users = results[0]
      let total = results[1]
      res.status(200).send({ page, total, count: users.length, perPage, users })
    })
    .catch(e => res.status(400).send())
})

router.post('/roles', (req, res) => {
  Role.find({
    _company: req.body.company,
    _partner: req.body.partner
  })
    .then(roles => res.status(200).send({ roles }))
    .catch(e => res.status(400).send())
})

router.post('/', createUser, (req, res) => {
  let isTasAdmin = req.body.isTasAdmin

  if (isTasAdmin) {
    Role.findOne({
      type: 'tas-admin'
    })
      .then(role => {
        if (!role) {
          return
        }

        return User.findOneAndUpdate(
          { _id: req.user._id },
          {
            $set: {
              _role: role._id
            }
          }
        )
      })
      .then(user => {})
      .catch(e => {})
  } // end if
})

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  User.findById(id)
    .populate('_company', 'name')
    .populate('_role')
    .populate('_partner')
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', async function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, [
    'country',
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age',
    '_company',
    '_department',
    '_admin',
    '_role',
    '_partner',
    'isTasAdmin'
  ])
  try {
    if (body.isTasAdmin) {
      // CASE: edit user become tas-admin
      let role = await Role.findOne({
        type: 'tas-admin'
      })
      if (!role) {
        return res.status(404).send()
      }
      body._role = role._id
    }
    let user = await User.findOneAndUpdate(
      {
        _id: {
          $eq: id,
          $ne: req.user._id // don't allow tas-admin update anything
        }
      },
      { $set: body },
      { new: true }
    )
    if (!user) {
      return res.status(404).send()
    }
    res.status(200).send({ user })
  } catch (error) {
    res.status(400).send()
  }
})

router.delete('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  User.findByIdAndDelete(id)
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
