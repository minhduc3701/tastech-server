require('../config/config')
require('../config/mongoose')

const User = require('../models/user')
const Company = require('../models/company')
const Role = require('../models/role')
const Request = require('../models/request')
const Policy = require('../models/policy')
const Department = require('../models/department')
const Trip = require('../models/trip')
const Expense = require('../models/expense')

if (process.env.NODE_ENV === 'production') {
  console.log("Don't wipe your production")
  process.exit(1)
}

Promise.all([
  User.deleteMany({}),
  Company.deleteMany({}),
  Role.deleteMany({}),
  Request.deleteMany({}),
  Policy.deleteMany({}),
  Department.deleteMany({}),
  Trip.deleteMany({}),
  Expense.deleteMany({})
])
  .then(results => {
    console.log('Wiped all data.')
    process.exit(0)
  })
  .catch(e => {
    console.log('Something went wrong.')
    process.exit(1)
  })
