const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Role = require('../../src/models/role')
const Company = require('../../src/models/company')
const Department = require('../../src/models/department')
const Policy = require('../../src/models/policy')
const Trip = require('../../src/models/trip')
const Expense = require('../../src/models/expense')

const companyId = new mongoose.Types.ObjectId()
const company2Id = new mongoose.Types.ObjectId()
const partnerCompanyId = new mongoose.Types.ObjectId()
const partnerCompany2Id = new mongoose.Types.ObjectId()
const partnerCompany3Id = new mongoose.Types.ObjectId()

const tasAdminRoleId = new mongoose.Types.ObjectId()
const adminRoleId = new mongoose.Types.ObjectId()
const partnerAdminRoleId = new mongoose.Types.ObjectId()
const adminCompany2RoleId = new mongoose.Types.ObjectId()
const employeeRoleId = new mongoose.Types.ObjectId()
const managerRoleId = new mongoose.Types.ObjectId()
const accountantRoleId = new mongoose.Types.ObjectId()
const departmentId = new mongoose.Types.ObjectId()
const policyId = new mongoose.Types.ObjectId()
const tripWaitingId = new mongoose.Types.ObjectId()
const tripApprovedId = new mongoose.Types.ObjectId()
const userId = new mongoose.Types.ObjectId()
const user2Id = new mongoose.Types.ObjectId()
const userCompany2Id = new mongoose.Types.ObjectId()
const adminId = new mongoose.Types.ObjectId()
const partnerId = new mongoose.Types.ObjectId()
const partnerAdminId = new mongoose.Types.ObjectId()
const expenseId = new mongoose.Types.ObjectId()

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
  },
  {
    _id: partnerCompanyId,
    _partner: partnerId,
    name: 'Company 3',
    currency: 'USD'
  },
  {
    _id: partnerCompany2Id,
    _partner: partnerId,
    name: 'Company 4',
    currency: 'VND'
  },
  {
    _id: partnerCompany3Id,
    _partner: partnerId,
    name: 'Company 5',
    currency: 'SGD'
  }
]
const expensies = [
  {
    _attendees: [],
    status: 'waiting',
    receipts: [],
    _id: expenseId,
    name: 'expense 01',
    amount: 50,
    category: 'transportation',
    transactionDate: '2019-03-16',
    account: 'credit-card',
    message: 'There are receipts for taxi',
    city: 'BangKoK',
    _trip: tripApprovedId,
    _creator: userId,
    _company: companyId,
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
    _id: partnerAdminRoleId,
    name: 'Partner Admin',
    type: 'partner-admin',
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
    _id: adminCompany2RoleId,
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
    _creator: userId,
    status: 'approved'
  },
  {
    _id: tripWaitingId,
    name: 'waiting trip',
    _company: companyId,
    _creator: userId,
    status: 'waiting'
  }
]

const adminOne = {
  _id: adminId,
  firstName: 'Luis',
  lastName: 'Suarez',
  username: 'Suarez@example.com',
  email: 'Suarez@example.com',
  password: '56what!!',
  _company: companyId,
  _role: adminRoleId
}
const adminToken = jwt.sign(
  {
    id: adminId,
    email: adminOne.email,
    password: adminOne.password
  },
  process.env.JWT_SECRET
)

const partnerAdminOne = {
  _id: partnerAdminId,
  _role: partnerAdminRoleId,
  _partner: partnerId,
  firstName: 'Samuel',
  lastName: 'Eto',
  username: 'partner-admin@tastech.asia',
  email: 'partner-admin@tastech.asia',
  password: '12345678'
}
const partnerAdminToken = jwt.sign(
  {
    id: partnerAdminId,
    email: partnerAdminOne.email,
    password: partnerAdminOne.password
  },
  process.env.JWT_SECRET
)

const userOne = {
  _id: userId,
  firstName: 'Mike',
  username: 'mike@example.com',
  email: 'mike@example.com',
  password: '56what!!',
  _company: companyId,
  _role: employeeRoleId
}
const userToken = jwt.sign(
  {
    id: userId,
    email: userOne.email
  },
  process.env.JWT_SECRET
)

const userTwo = {
  _id: user2Id,
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
  username: 'employee@company2.com',
  email: 'employee@company2.com',
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

  await Expense.deleteMany()
  await Expense.insertMany(expensies)

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
  await adminOneDb.save()

  let partnerAdminOneDb = await new User(partnerAdminOne)
  await partnerAdminOneDb.save()
  await partnerAdminOneDb.setPassword(partnerAdminOne.password)
  await partnerAdminOneDb.save()
}

const partnerSampleCompanyOne = {
  name: 'Company 9',
  address: 'Tokyo',
  country: 'Japan',
  industry: 'Travel',
  website: 'www.tas-holding.jp',
  timezone: '+9',
  companySize: '50-100',
  language: 'english',
  currency: 'USD',
  lengthUnit: '',
  weightUnit: '',
  payment: 'deposit',
  creditLimitationAmount: 10000,
  warningAmount: '5000',
  sendMailToCompanyAdmin: true,
  sendMailToPartnerAdmin: true,
  contactName: 'Takaya Tomose',
  contactEmail: 'takaya@tas-holding.jp',
  contactCallingCode: '+65',
  contactPhone: '912333444',
  markupFlight: 'percentage',
  markupFlightAmount: 10,
  markupHotel: 'net',
  markupHotelAmount: 25,
  deposit: 1000,
  note: 'this is a sample note',
  onBehalf: false
}

module.exports = {
  tasAdminRoleId,
  userToken,
  userId,
  userOne,
  user2Id,
  userTwo,
  adminId,
  employeeRoleId,
  adminToken,
  departmentId,
  policyId,
  setupDatabase,
  tripWaitingId,
  tripApprovedId,
  userCompany2Id,
  expenseId,
  partnerAdminRoleId,
  partnerAdminOne,
  partnerAdminToken,
  partnerCompanyId,
  partnerSampleCompanyOne,
  adminRoleId,
  adminCompany2RoleId
}
