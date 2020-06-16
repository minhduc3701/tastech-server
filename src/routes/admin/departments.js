const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { getImageUri } = require('../../modules/utils')

let projectEmployeesFields = {
  'employees.email': 1,
  'employees.firstName': 1,
  'employees.lastName': 1,
  'employees.avatar': 1,
  'employees._id': 1,
  _company: 1,
  name: 1,
  '_accountant.firstName': 1,
  '_accountant.lastName': 1,
  '_accountant.email': 1,
  '_approver.firstName': 1,
  '_approver.lastName': 1,
  '_approver.email': 1,
  status: 1
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
  department.name = req.body.name
  department._approver = req.body._approver
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
      $lookup: {
        from: 'users',
        localField: '_approver',
        foreignField: '_id',
        as: '_approver'
      }
    },
    {
      $unwind: {
        path: '$_approver',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_accountant',
        foreignField: '_id',
        as: '_accountant'
      }
    },
    {
      $unwind: {
        path: '$_accountant',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: {
        createdAt: -1
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
  let perPage = _.get(req.query, 'perPage', 20)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let keyword = _.get(req.query, 'keyword', '')
  let orFind = {}
  if (keyword) {
    orFind = {
      $or: [
        {
          displayName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          firstName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          lastName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          email: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        }
      ]
    }
  }
  Promise.all([
    User.find({
      _company: req.user._company,
      _id: { $ne: req.user._id },
      _department: req.params.id,
      ...orFind
    })
      .sort([['_id', -1]])
      // .populate('_department')
      .populate('_role')
      .populate('_policy')
      .limit(perPage)
      .skip(perPage * page),
    User.countDocuments({
      _company: req.user._company,
      _id: { $ne: req.user._id },
      _department: req.params.id,
      ...orFind
    }),
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
        $lookup: {
          from: 'users',
          localField: '_approver',
          foreignField: '_id',
          as: '_approver'
        }
      },
      {
        $unwind: {
          path: '$_approver',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: projectEmployeesFields
      }
    ])
  ])
    .then(results => {
      let users = results[0]
      let total = results[1]
      let departments = results[2]
      if (!departments[0]) {
        return res.status(404).send()
      }
      departments = departments.map(departmentParser)
      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: users.length,
        perPage,
        users,
        department: departments[0]
      })
    })

    .catch(e => res.status(400).send())
})

router.patch('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['name', 'employees'])
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
router.patch('/addNewUsers/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let userIds = req.body
  let departmentId = req.params.id
  User.updateMany(
    {
      _id: {
        $in: userIds
      },
      _company: req.user._company
    },
    {
      $set: {
        _department: departmentId
      }
    }
  )
    .then(res.status(200).send())
    .catch(e => {
      res.status(400).send()
    })
})

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Promise.all([
    User.updateMany(
      {
        _department: req.params.id,
        _company: req.user._company
      },
      {
        $set: { _department: null }
      }
    ),
    Department.findOneAndDelete({
      _id: req.params.id,
      _company: req.user._company
    })
  ])
    .then(results => {
      let department = results[1]
      if (!department) {
        return res.status(404).send()
      }

      res.status(200).send({ department })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.put('/removeUsers', async (req, res) => {
  const department = await Department.findOne({
    _company: req.user._company,
    status: 'default'
  })
  User.updateMany(
    {
      _id: { $in: req.body },
      _company: req.user._company
    },
    {
      $set: { _department: department ? department._id : null }
    }
  )
    .then(data => {
      if (!data) {
        return res.status(404).send()
      }
      res.status(200).send(data)
    })
    .catch(e => {
      res.status(400).send()
    })
})
router.put('/removeUser/:id', async (req, res) => {
  let id = req.params.id
  const department = await Department.findOne({
    _company: req.user._company,
    status: 'default'
  })
  User.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
    },
    {
      $set: { _department: department ? department._id : null }
    }
  )
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }
      res.status(200).send(user)
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/options/select', (req, res) => {
  Department.find({
    _company: req.user._company
  })
    .populate('_approver', ['firstName', 'lastName', 'avatar'])
    .then(departments => {
      res.status(200).send({ departments })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
