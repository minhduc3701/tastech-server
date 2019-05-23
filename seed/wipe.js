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

const yargs = require('yargs')

const argv = yargs
  .options({
    m: {
      alias: 'message',
      describe: 'Collections to seed',
      required: true
    }
  })
  .help()
  .alias('help', 'h').argv

let message = argv.m

if (message !== 'I am ready to wipe all data') {
  console.log("You're not ready my friend, you're not ready!")
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
