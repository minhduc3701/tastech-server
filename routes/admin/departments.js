const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.post('/', function(req, res, next) {
  const department = new Department(req.body)
  department._company = req.user._company

  let employees = req.body.employees
  let newDepartment

  department
    .save()
    .then(department => {
      newDepartment = department

      return Department.updateMany(
        {
          _company: req.user._company,
          _id: {
            $ne: newDepartment._id
          }
        },
        {
          $pull: {
            employees: {
              $in: employees
            }
          }
        }
      )
    })
    .then(results => {
      return User.updateMany(
        {
          _id: {
            $in: employees
          }
        },
        {
          $set: {
            _department: newDepartment._id
          }
        }
      )
    })
    .then(results => {
      res.status(200).json({ department: newDepartment })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', (req, res) => {
  Department.find({ _company: req.user._company })
    .populate('employees', 'firstName avatar')
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
    .populate('employees', 'firstName avatar email')
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

  Promise.all([
    Department.updateMany(
      {
        _company: req.user._company,
        _id: {
          $ne: req.params.id
        }
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
