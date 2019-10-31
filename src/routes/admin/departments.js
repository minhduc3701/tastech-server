const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { getImageUri } = require('../../modules/utils')

let projectEmployeesFields = {
  'employees.hash': 0,
  'employees.salt': 0,
  'employees.username': 0,
  'employees._company': 0,
  'employees._policy': 0,
  'employees._role': 0,
  'employees._department': 0,
  'employees.__v': 0
}

const departmentParser = department => ({
  ...department,
  employees: department.employees.map(employee => ({
    ...employee,
    avatar: getImageUri(employee.avatar)
  }))
})

router.post('/', function(req, res, next) {
  const department = new Department(req.body)
  department._company = req.user._company

  let employees = req.body.employees
  let newDepartment

  department
    .save()
    .then(department => {
      newDepartment = department

      return User.updateMany(
        {
          _id: {
            $in: employees
          },
          _company: req.user._company
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
  Department.aggregate([
    {
      $match: {
        _company: req.user._company
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_department',
        as: 'employees'
      }
    },
    {
      $project: projectEmployeesFields
    }
  ])
    .then(departments => {
      departments = departments.map(departmentParser)
      res.status(200).send({ departments })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Department.aggregate([
    {
      $match: {
        _id: new ObjectID(req.params.id),
        _company: req.user._company
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_department',
        as: 'employees'
      }
    },
    {
      $project: projectEmployeesFields
    }
  ])
    .then(departments => {
      departments = departments.map(departmentParser)
      res.status(200).send({ department: departments[0] })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['name', 'employees'])

  Promise.all([
    User.updateMany(
      {
        _id: {
          $in: body.employees
        },
        _company: req.user._company
      },
      {
        $set: {
          _department: req.params.id
        }
      }
    ),
    User.updateMany(
      {
        _department: req.params.id,
        _id: {
          $nin: body.employees
        },
        _company: req.user._company
      },
      {
        $set: {
          _department: null
        }
      }
    ),
    Department.findOneAndUpdate(
      {
        _id: req.params.id,
        _company: req.user._company
      },
      {
        $set: { name: body.name }
      },
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
