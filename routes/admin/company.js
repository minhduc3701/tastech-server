const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const { upload } = require('../../config/aws')
const singleUpload = upload.single('logo')
const _ = require('lodash')

router.get('/me', function(req, res) {
  Company.findOne({ _owner: req.user._id })
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }

      res.status(200).send({ company })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/me', async (req, res) => {
  const body = _.pick(req.body, ['name'])

  Company.findOneAndUpdate(
    {
      _owner: req.user._id
    },
    {
      $set: body
    },
    {
      new: true
    }
  )
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }

      res.status(200).send({
        company
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/me/logo', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        errors: [{ title: 'Image Upload Error', detail: err.message }]
      })
    }

    Company.findOneAndUpdate(
      {
        _owner: req.user._id
      },
      {
        $set: {
          logo: req.file.key
        }
      },
      {
        new: true
      }
    )
      .then(company => {
        if (!company) {
          return res.status(404).send()
        }

        return res.status(200).send({
          logo: req.file.location
        })
      })
      .catch(e => {
        return res.status(400).send()
      })
  })
})

module.exports = router
