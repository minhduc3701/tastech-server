const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Role = require('../../src/models/role')
const Company = require('../../src/models/company')
const Department = require('../../src/models/department')
const Policy = require('../../src/models/policy')
const Trip = require('../../src/models/trip')

const companyId = new mongoose.Types.ObjectId()
const company2Id = new mongoose.Types.ObjectId()

const tasAdminRoleId = new mongoose.Types.ObjectId()
const adminRoleId = new mongoose.Types.ObjectId()
const employeeRoleId = new mongoose.Types.ObjectId()
const managerRoleId = new mongoose.Types.ObjectId()
const accountantRoleId = new mongoose.Types.ObjectId()
const departmentId = new mongoose.Types.ObjectId()
const policyId = new mongoose.Types.ObjectId()
const tripWaitingId = new mongoose.Types.ObjectId()
const tripApprovedId = new mongoose.Types.ObjectId()
const userOneId = new mongoose.Types.ObjectId()
const userTwoId = new mongoose.Types.ObjectId()
const userCompany2Id = new mongoose.Types.ObjectId()
const adminOneId = new mongoose.Types.ObjectId()

const companies = [
  {
    _id: companyId,
    name: 'Company 1',
    currency: 'USD'
  },
  {
    _id: company2Id,
    name: 'Company 2',
    currency: 'USD'
  }
]

const companyRoles = [
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
    _company: companyId
  },
  {
    _id: employeeRoleId,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyId
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
    _company: companyId
  },
  {
    _id: accountantRoleId,
    name: 'Accountant',
    type: 'accountant',
    permissions: ['CAN_ACCESS_BOOKING', 'CAN_ACCESS_EXPENSE'],
    _company: companyId
  },

  // company 2
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: company2Id
  }
]

const companyOneDepartments = [
  {
    _id: departmentId,
    _company: companyId,
    name: `Company 1 - Department 1 `
  }
]

const policies = [
  {
    _id: policyId,
    name: 'Company 1 - Policy 1',
    _company: companyId
  }
]

const trips = [
  {
    _id: tripApprovedId,
    name: 'approved trip ',
    _company: companyId,
    _creator: userOneId,
    status: 'approved'
  },
  {
    _id: tripWaitingId,
    name: 'waiting trip',
    _company: companyId,
    _creator: userOneId,
    status: 'waiting'
  }
]

const adminOne = {
  _id: adminOneId,
  firstName: 'Luis',
  lastName: 'Suarez',
  username: 'Suarez@example.com',
  email: 'Suarez@example.com',
  password: '56what!!',
  _company: companyId,
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

const userOne = {
  _id: userOneId,
  firstName: 'Mike',
  username: 'mike@example.com',
  email: 'mike@example.com',
  password: '56what!!',
  _company: companyId,
  _role: employeeRoleId
}
const userOneToken = jwt.sign(
  {
    id: userOneId,
    email: userOne.email
  },
  process.env.JWT_SECRET
)

const userTwo = {
  _id: userTwoId,
  firstName: 'Jess',
  username: 'jess@example.com',
  email: 'jess@example.com',
  password: 'myhouse099@@',
  _company: companyId,
  _role: employeeRoleId
}

const userCompany2 = {
  _id: userCompany2Id,
  firstName: 'Jess',
  username: 'company2Id@example.com',
  email: 'company2Id@example.com',
  password: 'myhouse099@@',
  _company: company2Id,
  _role: employeeRoleId
}
const setupDatabase = async () => {
  await Trip.deleteMany()
  await Trip.insertMany(trips)

  await Role.deleteMany()
  await Role.insertMany(companyRoles)

  await Policy.deleteMany()
  await Policy.insertMany(policies)

  await Department.deleteMany()
  await Department.insertMany(companyOneDepartments)

  await Company.deleteMany()
  await Company.insertMany(companies)

  await User.deleteMany()
  let userOneDb = await new User(userOne)
  await userOneDb.save()
  await userOneDb.setPassword(userOne.password)
  await userOneDb.save()
  let userTwoDb = await new User(userTwo)
  await userTwoDb.save()
  await userTwoDb.setPassword(userTwo.password)
  await userTwoDb.save()
  let userCompany2Db = await new User(userCompany2)
  await userCompany2Db.save()
  await userCompany2Db.setPassword(userCompany2.password)
  await userCompany2Db.save()
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
  adminOneId,
  employeeRoleId,
  adminOneToken,
  departmentId,
  policyId,
  setupDatabase,
  tripWaitingId,
  tripApprovedId,
  userCompany2Id
}
