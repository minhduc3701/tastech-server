var express = require('express')
var router = express.Router()
const User = require('../models/user')
const { upload } = require('../config/aws')
const singleUpload = upload.single('image')
const _ = require('lodash')

router.get('/me', function(req, res, next) {
  res.send(req.user)
})

router.patch('/me', async (req, res) => {
  const body = _.pick(req.body, [
    'country',
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age'
  ])

  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: body
    },
    {
      new: true
    }
  )
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({
        user
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/me/avatar', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        errors: [{ title: 'Image Upload Error', detail: err.message }]
      })
    }

    User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: req.file.key
        }
      },
      {
        new: true
      }
    )
      .then(user => {
        if (!user) {
          return res.status(404).send()
        }

        return res.status(200).send({
          email: user.email,
          avatar: req.file.location
        })
      })
      .catch(e => {
        return res.status(400).send()
      })
  })
})

router.patch('/me/password', (req, res) => {
  let oldPassword = req.body.oldPassword
  let password = req.body.password
  let confirmationPassword = req.body.confirmationPassword

  if (password !== confirmationPassword) {
    return res.status(400).send({
      message: 'Password mismatch.'
    })
  }

  req.user.authenticate(oldPassword, (err, user, passwordErr) => {
    if (passwordErr) {
      return res.status(400).send()
    }

    user
      .setPassword(password)
      .then(() => user.save())
      .then(() =>
        res.status(200).send({
          message: 'Reset password successfully.'
        })
      )
      .catch(e => {
        res.status(400).send()
      })
  })
})

module.exports = router
