var express = require('express')
var router = express.Router()
const { upload } = require('../config/aws')
const User = require('../models/user')

router.get('/me', function(req, res, next) {
  res.send(req.user)
})

const singleUpload = upload.single('image')

router.post('/me/avatar', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res
        .status(422)
        .send({
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

module.exports = router
