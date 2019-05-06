const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

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
    .sort([['_id', -1]])
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

router.patch('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['name', 'employees'])

  body.employees = body.employees.map(id => new ObjectID(id))

  Promise.all([
    Department.updateMany(
      {
        _company: req.user._company
      },
      {
        $pull: {
          employees: {
            $in: body.employees
          }
        }
      }
    ),
    User.updateMany(
      {
        _id: {
          $in: body.employees
        }
      },
      {
        $set: {
          _department: req.params.id
        }
      }
    ),
    Department.findOneAndUpdate(
      {
        _id: req.params.id,
        _company: req.user._company
      },
      { $set: body },
      { new: true }
    )
  ])
    .then(results => {
      let department = results[2]
      if (!department) {
        return res.status(404).send()
      }

      res.status(200).send({ department })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Department.findOneAndDelete({
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
