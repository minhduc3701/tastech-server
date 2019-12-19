const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Role = require('../../src/models/role')
const Company = require('../../src/models/company')
const Department = require('../../src/models/department')
const Policy = require('../../src/models/policy')

const companyOneId = new mongoose.Types.ObjectId()

const companyOne = {
  _id: companyOneId,
  name: 'Company one',
  currency: 'USD'
}

const tasAdminRoleId = new mongoose.Types.ObjectId()
const adminRoleId = new mongoose.Types.ObjectId()
const employeeRoleId = new mongoose.Types.ObjectId()
const managerRoleId = new mongoose.Types.ObjectId()
const accountantRoleId = new mongoose.Types.ObjectId()
const departmentOne = new mongoose.Types.ObjectId()
const policyOne = new mongoose.Types.ObjectId()
const companyOneRoles = [
  {
    _id: tasAdminRoleId,
    name: 'Tas Admin',
    type: 'tas-admin',
    permissions: []
  },
  {
    _id: adminRoleId,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: companyOneId
  },
  {
    _id: employeeRoleId,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyOneId
  },
  {
    _id: managerRoleId,
    name: 'Manager',
    type: 'manager',
    permissions: [
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_ANALYTICS',
      'CAN_ACCESS_BOOKING'
    ],
    _company: companyOneId
  },
  {
    _id: accountantRoleId,
    name: 'Accountant',
    type: 'accountant',
    permissions: ['CAN_ACCESS_BOOKING', 'CAN_ACCESS_EXPENSE'],
    _company: companyOneId
  }
]

const companyOneDepartments = [
  {
    _id: departmentOne,
    _company: companyOneId,
    name: `Company 1 - Department 1 `
  }
]

const policies = [
  {
    _id: policyOne,
    name: 'Company 1 - Policy 1',
    _company: companyOneId
  }
]

const adminOneId = new mongoose.Types.ObjectId()
const adminOne = {
  _id: adminOneId,
  firstName: 'Luis',
  lastName: 'Suarez',
  username: 'Suarez@example.com',
  email: 'Suarez@example.com',
  password: '56what!!',
  _company: companyOneId,
  _role: adminRoleId
}
const adminOneToken = jwt.sign(
  {
    id: adminOneId,
    email: adminOne.email,
    password: adminOne.password
  },
  process.env.JWT_SECRET
)

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
  _id: userOneId,
  firstName: 'Mike',
  username: 'mike@example.com',
  email: 'mike@example.com',
  password: '56what!!',
  _company: companyOneId,
  _role: employeeRoleId
}
const userOneToken = jwt.sign(
  {
    id: userOneId,
    email: userOne.email
  },
  process.env.JWT_SECRET
)

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
  _id: userTwoId,
  firstName: 'Jess',
  username: 'jess@example.com',
  email: 'jess@example.com',
  password: 'myhouse099@@',
  _company: companyOneId,
  _role: employeeRoleId
}

const setupDatabase = async () => {
  await Role.deleteMany()
  await Role.insertMany(companyOneRoles)

  await Policy.deleteMany()
  await Policy.insertMany(policies)

  await Department.deleteMany()
  await Department.insertMany(companyOneDepartments)

  await Company.deleteMany()
  await new Company(companyOne).save()

  await User.deleteMany()
  let userOneDb = await new User(userOne)
  await userOneDb.save()
  await userOneDb.setPassword(userOne.password)
  await userOneDb.save()
  let userTwoDb = await new User(userTwo)
  await userTwoDb.save()
  await userTwoDb.setPassword(userTwo.password)
  await userTwoDb.save()
  let adminOneDb = await new User(adminOne)
  await adminOneDb.save()
  await adminOneDb.setPassword(adminOne.password)
  // await adminOneDb.save()
}

module.exports = {
  tasAdminRoleId,
  userOneToken,
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  employeeRoleId,
  adminOneToken,
  departmentOne,
  policyOne,
  setupDatabase
}
