const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const { ObjectID } = require('mongodb')

router.post('/', function(req, res, next) {
  const department = new Department(req.body)
  department._company = req.user._company
  department
    .save()
    .then(() => {
      res.status(200).json({ department })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', (req, res) => {
  Department.find({ _company: req.user._company })
    .then(departments => res.status(200).send({ departments }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Department.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .then(department => {
      if (!department) {
        return res.status(404).send()
      }

      res.status(200).send({ department })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
