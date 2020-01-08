const express = require('express')
const router = express.Router()
const Company = require('../../models/company')

const { fileUpload } = require('../../config/aws')
const upload = fileUpload('avatar')
const singleUpload = upload.single('logo')

const _ = require('lodash')
const { currentCompany } = require('../../middleware/company')

router.get('/', currentCompany, function(req, res) {
  res.status(200).send({ company: req.company })
})

router.patch('/', (req, res) => {
  const body = _.pick(req.body, [
    'name',
    'address',
    'website',
    'country',
    'city',
    'companySize',
    'timezone',
    'industry',
    'exchangedRate',
    '_policy',
    'language',
    'weightUnit',
    'lengthUnit'
  ])

  Company.findByIdAndUpdate(
    req.user._company,
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

router.post('/logo', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        code: err.code
      })
    }

    Company.findByIdAndUpdate(
      req.user._company,
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
