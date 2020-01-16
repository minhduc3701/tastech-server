const { ObjectID } = require('mongodb')
const User = require('../../models/user')
const Partner = require('../../models/partner')
const Company = require('../../models/company')
const Role = require('../../models/role')
const Request = require('../../models/request')
const Policy = require('../../models/policy')
const Department = require('../../models/department')
const Trip = require('../../models/trip')
const Expense = require('../../models/expense')
const Reward = require('../../models/reward')
const Voucher = require('../../models/voucher')
const Option = require('../../models/option')
const Change = require('chance')
const chance = new Change()

const tasAdminId = new ObjectID('5cc2d7a24c72b61214af0049')
const adminId = new ObjectID('5cc2d7a24c72b61214af004a')
const employeeId = new ObjectID('5cc2d7a24c72b61214af004b')
const employeeId2 = new ObjectID('5cc2d7a24c72b61214af004c')

const companyId = new ObjectID('5cc2d7a24c72b61214af004d')
const companyId2 = new ObjectID()
const companyId3 = new ObjectID()

const tripId = new ObjectID('5cc2d7a24c72b61214af0051')
const tripId2 = new ObjectID('5cc2d7a24c72b61214af0052')
const tripId3 = new ObjectID('5cc2d7a24c72b61214af0053')
const tripId4 = new ObjectID('5cc2d7a24c72b61214af0054')
const tripId5 = new ObjectID('5cc2d7a24c72b61214af0055')
const tripId6 = new ObjectID('5cc2d7a24c72b61214af0056')
const tripId7 = new ObjectID('5cc2d7a24c72b61214af0057')
const tripId8 = new ObjectID('5cc2d7a24c72b61214af0000')
const tripIdsUser1 = [
  tripId,
  tripId2,
  tripId3,
  tripId4,
  tripId5,
  tripId6,
  tripId7,
  tripId8
]
const tripIdsUser2 = []
const departmentId = new ObjectID('5cd03b1571811c06ad420d36')
const departmentId2 = new ObjectID('5cd03b1571811c06ad420d35')
const tasAdminRoleId = new ObjectID('5cc2d7a24c72b61214af0058')
const adminRoleId = new ObjectID('5cc2d7a24c72b61214af0059')
const adminRoleId2 = new ObjectID()
const adminRoleId3 = new ObjectID()

const employeeRoleId = new ObjectID('5cc2d7a24c72b61214af0060')
const employeeRoleId2 = new ObjectID()
const employeeRoleId3 = new ObjectID()
const managerId = new ObjectID()
const managerRoleId = new ObjectID()
const accountantId = new ObjectID()
const accountantRoleId = new ObjectID()
// partner id
const partnerId = new ObjectID('5cc2d7a24c72b61214aa0001')
const partnerId2 = new ObjectID('5cc2d7a24c72b61214aa0002')
const partnerAdminId = new ObjectID('5cc2d7a24c72b61214aa0003')
const companyPartnerId = new ObjectID('5de9f4b1c9bda20d4b4b8497')
const company2PartnerId = new ObjectID('5de9f4b1c9bda20d4b4b8498')
const companyPartnerId2 = new ObjectID()
const adminPartnerId = new ObjectID('5cc2d7a24c72b61214aa0004')
const adminCompnay2PartnerId = new ObjectID('5cc2d7a24c72b61214aa0005')
const adminPartnerId2 = new ObjectID()
const employeeParterId = new ObjectID('5de88939a7d0a4095eddfede')
const employeeParterId2 = new ObjectID()
const managerPartnerId = new ObjectID()
const managerPartnerId2 = new ObjectID()
const accountantPartnerId = new ObjectID()
const accountantPartnerId2 = new ObjectID()
// =======================
// role, department for partner flow
const departmentPartnerId = new ObjectID()
const department2PartnerId = new ObjectID()
const departmentPartnerId2 = new ObjectID()
const partnerRoleId = new ObjectID('5df0697ed1b5060fe38626a8')
const partnerRoleId2 = new ObjectID()
const adminRolePartnerId = new ObjectID()
const adminRoleCompany2PartnerId = new ObjectID()
const adminRolePartnerId2 = new ObjectID()
const employeeRolePartnerId = new ObjectID()
const employeeRolePartnerId2 = new ObjectID()
const managerRolePartnerId = new ObjectID()
const managerRolePartnerId2 = new ObjectID()
const accountantRolePartnerId = new ObjectID()
const accountantRolePartnerId2 = new ObjectID()
//=======================

const password = '12345678'
const defaultPolicyId = new ObjectID()
const defaultPolicyId2 = new ObjectID()
const defaultPolicyId3 = new ObjectID()
const defaultPolicyPartnerId4 = new ObjectID()
const defaultPolicyPartnerId5 = new ObjectID()
const policyId1 = new ObjectID()
const policyId2 = new ObjectID()

const randomItemInArray = items =>
  items[Math.floor(Math.random() * items.length)]

const users = [
  {
    _id: tasAdminId,
    username: 'tas-admin@tastech.asia',
    email: 'tas-admin@tastech.asia',
    firstName: chance.first(),
    lastName: chance.last(),
    _role: tasAdminRoleId
  },
  {
    _id: adminId,
    username: 'admin@tastech.asia',
    email: 'admin@tastech.asia',
    _company: companyId,
    _role: adminRoleId
  },
  {
    _id: employeeId,
    username: 'employee@tastech.asia',
    email: 'employee@tastech.asia',
    _company: companyId,
    _role: employeeRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN'
  },
  {
    _id: managerId,
    username: 'manager@tastech.asia',
    email: 'manager@tastech.asia',
    _company: companyId,
    _role: managerRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN'
  },
  {
    username: 'manager2@tastech.asia',
    email: 'manager2@tastech.asia',
    _company: companyId,
    _role: managerRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId,
    phone: '123546456',
    dateOfBirth: new Date('1996-07-02'),
    country: 'CN'
  },
  {
    _id: accountantId,
    username: 'accountant@tastech.asia',
    email: 'accountant@tastech.asia',
    _company: companyId,
    _role: accountantRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN'
  },
  {
    username: 'accountant2@tastech.asia',
    email: 'accountant2@tastech.asia',
    _company: companyId,
    _role: accountantRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId,
    phone: '1239871',
    dateOfBirth: new Date('1996-07-02'),
    country: 'EN'
  },
  {
    _id: employeeId2,
    username: 'employee2@tastech.asia',
    email: 'employee2@tastech.asia',
    _company: companyId,
    _role: employeeRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId
  },

  // admin, employee for company 2
  {
    username: 'a1c2@tastech.asia',
    email: 'a1c2@tastech.asia',
    _company: companyId2,
    _role: adminRoleId2
  },
  {
    username: 'e1c2@tastech.asia',
    email: 'e1c2@tastech.asia',
    _company: companyId2,
    _role: employeeRoleId2,
    firstName: chance.first(),
    lastName: chance.last()
  },

  // admin, employee for company 3
  {
    username: 'a1c3@tastech.asia',
    email: 'a1c3@tastech.asia',
    _company: companyId3,
    _role: adminRoleId3
  },
  {
    username: 'e1c3@tastech.asia',
    email: 'e1c3@tastech.asia',
    _company: companyId3,
    _role: employeeRoleId3,
    firstName: chance.first(),
    lastName: chance.last()
  },

  // partner admin
  {
    _id: partnerAdminId,
    username: 'partner-admin@tastech.asia',
    email: 'partner-admin@tastech.asia',
    _partner: partnerId,
    avatar: `http://i.pravatar.cc/150?img=1`,
    _role: partnerRoleId,
    firstName: 'Thierry',
    lastName: 'Henry'
  },
  {
    username: 'partner-admin2@tastech.asia',
    email: 'partner-admin2@tastech.asia',
    _partner: partnerId2,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: partnerRoleId2,
    firstName: 'Lionel',
    lastName: 'Messi'
  },
  // user for company partner 1
  {
    _id: adminPartnerId,
    username: 'adminPartner@tastech.asia',
    email: 'adminPartner@tastech.asia',
    _company: companyPartnerId,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRolePartnerId,
    _partner: partnerId
  },
  {
    _id: employeeParterId,
    username: 'employeePartner@tastech.asia',
    email: 'employeePartner@tastech.asia',
    _company: companyPartnerId,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: employeeRolePartnerId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId
  },
  {
    _id: managerPartnerId,
    username: 'managerPartner@tastech.asia',
    email: 'managerPartner@tastech.asia',
    _company: companyPartnerId,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: managerRolePartnerId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId
  },
  {
    _id: accountantPartnerId,
    username: 'accountantPartner@tastech.asia',
    email: 'accountantPartner@tastech.asia',
    _company: companyPartnerId,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: accountantRolePartnerId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId
  },
  // user for company 2 partner 1
  {
    _id: adminCompnay2PartnerId,
    username: 'adminCompnay2Partner@tastech.asia',
    email: 'adminCompnay2@tastech.asia',
    _company: company2PartnerId,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRoleCompany2PartnerId,
    _partner: partnerId
  },
  // user for company partner 2
  {
    _id: adminPartnerId2,
    username: 'adminPartner2@tastech.asia',
    email: 'adminPartner2@tastech.asia',
    _company: companyPartnerId2,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRolePartnerId2,
    _partner: partnerId2
  },
  {
    _id: employeeParterId2,
    username: 'employeePartner2@tastech.asia',
    email: 'employeePartner2@tastech.asia',
    _company: companyPartnerId2,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: employeeRolePartnerId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId2
  },
  {
    _id: managerPartnerId2,
    username: 'managerPartner2@tastech.asia',
    email: 'managerPartner2@tastech.asia',
    _company: companyPartnerId2,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: managerRolePartnerId2,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId2,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId2
  },
  {
    _id: accountantPartnerId2,
    username: 'accountantPartner2@tastech.asia',
    email: 'accountantPartner2@tastech.asia',
    _company: companyPartnerId2,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: accountantRolePartnerId2,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentPartnerId2,
    phone: '0819020695',
    dateOfBirth: new Date('1996-07-02'),
    country: 'VN',
    _partner: partnerId2
  }
]
for (let i = 2; i < 50; i++) {
  let email = `employee${i - 1}Partner@tastech.asia`
  users.push({
    _id: new ObjectID(),
    username: email,
    email,
    _company: companyPartnerId,
    _partner: partnerId,
    firstName: chance.first(),
    lastName: chance.last(),
    avatar: `http://i.pravatar.cc/150?img=${i + 1}`,
    _department: randomItemInArray([departmentPartnerId, department2PartnerId]),
    _role: employeeRolePartnerId,
    _policy: defaultPolicyPartnerId4,
    phone: (Math.random() * 1000000000).toFixed(0),
    dateOfBirth: chance.birthday(),
    country: 'VN'
  })
}
for (let i = 4; i < 50; i++) {
  let email = `employee${i - 1}@tastech.asia`

  users.push({
    _id: new ObjectID(),
    username: email,
    email,
    _company: companyId,
    firstName: chance.first(),
    lastName: chance.last(),
    avatar: i < 40 ? '' : `http://i.pravatar.cc/150?img=${i + 1}`,
    _department: randomItemInArray([departmentId, departmentId2]),
    _role: employeeRoleId,
    _policy: randomItemInArray([policyId1, policyId2]),
    phone: (Math.random() * 1000000000).toFixed(0),
    dateOfBirth: new Date('1990-01-01'),
    country: 'VN'
  })
}

const companies = [
  {
    _id: companyId,
    name: 'TAS',
    exchangedRate: 10,
    _policy: defaultPolicyId,
    currency: 'USD'
  },
  {
    _id: companyId2,
    name: 'Company 2',
    exchangedRate: 10,
    _policy: defaultPolicyId2,
    currency: 'SGD'
  },
  {
    _id: companyId3,
    name: 'Company 3',
    exchangedRate: 10,
    _policy: defaultPolicyId3,
    currency: 'VND'
  },
  {
    _id: companyPartnerId,
    name: 'Partner company 1',
    exchangedRate: 10,
    _policy: defaultPolicyPartnerId4,
    currency: 'USD',
    _partner: partnerId,
    contactName: 'Henry Suju',
    contactEmail: 'henry@gmail.com',
    contactPhone: '0981234234',
    contactCallingCode: '+44',
    onBehalf: true,
    payment: 'deposit',
    isCreditLimitation: true,
    creditLimitationAmount: 2000,
    warningAmount: 500,
    sendMailToCompanyAdmin: true,
    sendMailToPartnerAdmin: true,
    balance: 0,
    markupFlight: 'net',
    markupFlightAmount: 20,
    markupHotel: 'percentage',
    markupHotelAmount: 5,
    note: 'something about company'
  },
  {
    _id: company2PartnerId,
    name: 'Partner company 2',
    exchangedRate: 10,
    _policy: defaultPolicyPartnerId4,
    currency: 'USD',
    _partner: partnerId,
    contactName: 'Choi Siwon Suju',
    contactEmail: 'siwon.suju@gmail.com',
    contactPhone: '0981234234',
    contactCallingCode: '+44',
    onBehalf: true,
    payment: 'deposit',
    isCreditLimitation: true,
    creditLimitationAmount: 2000,
    warningAmount: 500,
    sendMailToCompanyAdmin: true,
    sendMailToPartnerAdmin: true,
    balance: 0,
    markupFlight: 'net',
    markupFlightAmount: 20,
    markupHotel: 'percentage',
    markupHotelAmount: 5,
    note: 'something about company'
  },
  {
    _id: companyPartnerId2,
    name: 'Partner company 2',
    exchangedRate: 10,
    _policy: defaultPolicyPartnerId5,
    currency: 'USD',
    _partner: partnerId2,
    contactName: 'Ha phan',
    contactEmail: 'phan@gmail.com',
    contactPhone: '0819020796',
    contactCallingCode: '+44',
    onBehalf: false,
    payment: 'credit-card',
    isCreditLimitation: true,
    // creditLimitationAmount: 2000,
    // warningAmount: 500,
    // sendMailToCompanyAdmin: true,
    // sendMailToPartnerAdmin: true,
    // balance: 0,
    markupFlight: 'net',
    markupFlightAmount: 20,
    markupHotel: 'percentage',
    markupHotelAmount: 5,
    note: 'something about company'
  }
]

for (let i = 3; i < 30; i++) {
  companies.push({
    name: chance.company(),
    exchangedRate: 10,
    currency: 'USD'
  })
}

for (let i = 0; i < 20; i++) {
  companies.push({
    _id: new ObjectID(),
    name: chance.company(),
    exchangedRate: 10,
    _policy: defaultPolicyPartnerId4,
    currency: 'USD',
    _partner: partnerId,
    contactName: chance.name(),
    contactEmail: chance.email(),
    contactPhone: chance.phone(),
    contactCallingCode: '+65',
    onBehalf: true,
    payment: 'deposit',
    isCreditLimitation: true,
    creditLimitationAmount: 2000,
    warningAmount: 500,
    sendMailToCompanyAdmin: true,
    sendMailToPartnerAdmin: true,
    balance: 0,
    markupFlight: 'net',
    markupFlightAmount: 20,
    markupHotel: 'percentage',
    markupHotelAmount: 5,
    note: 'something about company'
  })
}

const partners = [
  {
    _id: partnerId,
    name: 'Giamso Travel',
    address: 'Singapore City, Singapore',
    country: 'Singapore',
    contactTitle: 'Mr',
    contactName: 'Ha Huy',
    contactEmail: 'giamso@tastech.asia',
    contactPhone: '123123123',
    currency: 'USD'
  },
  {
    _id: partnerId2,
    name: 'Giamso 2',
    address: 'Singapore City, Singapore',
    country: 'Singapore',
    contactTitle: 'Mr',
    contactName: 'Ha Huy',
    contactEmail: 'giamso2@tastech.asia',
    contactPhone: '123123123',
    currency: 'USD'
  }
]

for (let i = 3; i < 30; i++) {
  partners.push({
    name: chance.company(),
    address: chance.address(),
    country: chance.country(),
    contactTitle: 'Mr',
    contactName: chance.name(),
    contactEmail: chance.email(),
    contactPhone: chance.phone(),
    currency: 'USD'
  })
}
const roles = [
  {
    _id: tasAdminRoleId,
    name: 'Tas Admin',
    type: 'tas-admin',
    permissions: []
  },
  {
    _id: partnerRoleId,
    name: 'Partner Admin',
    type: 'partner-admin',
    _partner: partnerId,
    permissions: []
  },
  {
    _id: partnerRoleId2,
    name: 'Partner Admin',
    type: 'partner-admin',
    _partner: partnerId2,
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
  // company 2 roles
  {
    _id: adminRoleId2,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: companyId2
  },
  {
    _id: employeeRoleId2,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyId2
  },

  // company 3 roles
  {
    _id: adminRoleId3,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: companyId3
  },
  {
    _id: employeeRoleId3,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyId3
  },
  // partner 1 role
  {
    _id: adminRolePartnerId,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_REWARD',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: companyPartnerId,
    _partner: partnerId
  },
  {
    _id: employeeRolePartnerId,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyPartnerId,
    _partner: partnerId
  },
  {
    _id: managerRolePartnerId,
    name: 'Manager',
    type: 'manager',
    permissions: [
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_ANALYTICS',
      'CAN_ACCESS_BOOKING'
    ],
    _company: companyPartnerId,
    _partner: partnerId
  },
  {
    _id: accountantRolePartnerId,
    name: 'Accountant',
    type: 'accountant',
    permissions: ['CAN_ACCESS_BOOKING', 'CAN_ACCESS_EXPENSE'],
    _company: companyPartnerId,
    _partner: partnerId
  },
  {
    _id: adminRoleCompany2PartnerId,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_REWARD',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: company2PartnerId,
    _partner: partnerId
  },
  // partner 2 role
  {
    _id: adminRolePartnerId2,
    name: 'Admin',
    type: 'admin',
    permissions: [
      'CAN_ACCESS_COMPANY',
      'CAN_ACCESS_REWARD',
      'CAN_ACCESS_BOOKING',
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_EXPENSE',
      'CAN_ACCESS_ANALYTICS'
    ],
    _company: companyPartnerId2,
    _partner: partnerId2
  },
  {
    _id: employeeRolePartnerId2,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_ACCESS_BOOKING'],
    _company: companyPartnerId2,
    _partner: partnerId2
  },
  {
    _id: managerRolePartnerId2,
    name: 'Manager',
    type: 'manager',
    permissions: [
      'CAN_ACCESS_BUDGET',
      'CAN_ACCESS_ANALYTICS',
      'CAN_ACCESS_BOOKING'
    ],
    _company: companyPartnerId2,
    _partner: partnerId2
  },
  {
    _id: accountantRolePartnerId2,
    name: 'Accountant',
    type: 'accountant',
    permissions: ['CAN_ACCESS_BOOKING', 'CAN_ACCESS_EXPENSE'],
    _company: companyPartnerId2,
    _partner: partnerId2
  }
]

const requests = [
  {
    email: 'admin@tastech.asia',
    firstName: 'John',
    lastName: 'Doe',
    phone: '123456',
    company: 'TAS',
    role: 'employer',
    numberOfEmployees: 100,
    country: 'US',
    status: 'completed',
    notes: [
      {
        _id: new ObjectID(),
        note: 'Call via phone, customer accepted.',
        status: 'completed'
      }
    ]
  },
  {
    email: 'steve@apple.com',
    firstName: 'Steve',
    lastName: 'Job',
    phone: '123456',
    company: 'Apple',
    role: 'employer',
    numberOfEmployees: 100,
    country: 'US',
    status: 'pending',
    notes: [
      {
        _id: new ObjectID(),
        note: 'Call but no responses',
        status: 'pending'
      },
      {
        _id: new ObjectID(),
        note: 'Call 2nd but customer delay',
        status: 'pending'
      }
    ]
  },
  {
    email: 'bill@microsoft.com',
    firstName: 'Bill',
    lastName: 'Gate',
    phone: '123456',
    company: 'Microsoft',
    role: 'employer',
    numberOfEmployees: 100,
    country: 'US',
    status: 'waiting'
  },
  {
    email: 'mark@facebook.com',
    firstName: 'Mark',
    lastName: 'Mark',
    phone: '123456',
    company: 'Facebook',
    role: 'employer',
    numberOfEmployees: 100,
    country: 'US',
    status: 'rejected',
    notes: [
      {
        _id: new ObjectID(),
        note: 'Customer rejected demo',
        status: 'rejected'
      }
    ]
  }
]

const requestStatuses = ['completed', 'pending', 'rejected', 'waiting']

for (let i = 0; i < 46; i++) {
  let email = chance.email()
  if (requests.findIndex(request => request.email === email) >= 0) {
    i -= 1
  } else {
    requests.push({
      email,
      firstName: chance.first(),
      lastName: chance.last(),
      phone: chance.phone(),
      company: chance.company(),
      role: chance.profession(),
      numberOfEmployees: chance.age(),
      country: chance.country(),
      status: randomItemInArray(requestStatuses),
      notes: []
    })
  }
}

const defaultPolicy = {
  name: 'Default Policy',
  status: 'default',
  flightClass: 'Economy',
  stops: '0',
  setDaysBeforeFlights: true,
  daysBeforeFlights: 7,
  setFlightLimit: false,
  flightLimit: 500,
  flightNotification: 'no',
  flightApproval: 'no',
  hotelClass: 3,
  hotelSearchDistance: 10,
  setDaysBeforeLodging: true,
  daysBeforeLodging: 7,
  setHotelLimit: false,
  hotelLimit: 500,
  hotelNotification: 'no',
  hotelApproval: 'no',
  setTransportLimit: true,
  transportLimit: 10,
  setMealLimit: true,
  mealLimit: 10,
  setProvision: true,
  provision: 5
}

const policies = [
  {
    ...defaultPolicy,
    _id: defaultPolicyId,
    _company: companyId
  },
  {
    _id: policyId1,
    name: 'Travel Policy for Staff',
    _company: companyId,
    status: 'enabled',
    flightClass: 'Economy',
    stops: '1',
    setDaysBeforeFlights: false,
    daysBeforeFlights: 7,
    setFlightLimit: false,
    flightLimit: 0,
    flightNotification: 'over',
    flightApproval: 'over',
    hotelClass: 3,
    hotelSearchDistance: 10,
    setDaysBeforeLodging: false,
    daysBeforeLodging: 7,
    setHotelLimit: false,
    hotelLimit: 0,
    hotelNotification: 'over',
    hotelApproval: 'over',
    setTransportLimit: false,
    transportLimit: 0,
    setMealLimit: false,
    mealLimit: 0,
    setProvision: false,
    provision: 10
  },
  {
    _id: policyId2,
    name: 'Travel Policy for Director',
    _company: companyId,
    status: 'disabled',
    flightClass: 'Economy',
    stops: '1+',
    setDaysBeforeFlights: true,
    daysBeforeFlights: 14,
    setFlightLimit: false,
    flightLimit: 0,
    flightNotification: 'all',
    flightApproval: 'all',
    hotelClass: 3,
    hotelSearchDistance: 10,
    setDaysBeforeLodging: true,
    daysBeforeLodging: 14,
    setHotelLimit: false,
    hotelLimit: 0,
    hotelNotification: 'all',
    hotelApproval: 'all',
    setTransportLimit: false,
    transportLimit: 0,
    setMealLimit: false,
    mealLimit: 0,
    setProvision: true,
    provision: 10
  },

  {
    ...defaultPolicy,
    _id: defaultPolicyId2,
    _company: companyId2
  },

  {
    ...defaultPolicy,
    _id: defaultPolicyId3,
    _company: companyId3
  },

  {
    ...defaultPolicy,
    _id: defaultPolicyPartnerId4,
    _company: companyPartnerId
  },

  {
    ...defaultPolicy,
    _id: defaultPolicyPartnerId5,
    _company: companyPartnerId2
  }
]

const trips = []
const tripStatus = ['waiting', 'approved', 'rejected', 'finished', 'completed']

for (let i = 0; i < 200; i++) {
  let rejectedProps = {}
  let status = randomItemInArray(tripStatus)
  if (status === 'rejected') {
    rejectedProps = {
      adminMessage:
        'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.',
      updatedByAdmin: adminId,
      updatedByAdminAt: new Date()
    }
  }
  let prices = [
    chance.integer({ min: 100, max: 1000 }),
    chance.integer({ min: 100, max: 1000 }),
    chance.integer({ min: 100, max: 1000 }),
    chance.integer({ min: 100, max: 1000 }),
    chance.integer({ min: 100, max: 1000 })
  ]
  let totalPrice = prices.reduce((acc, val) => acc + val, 0)
  let currentTripId = new ObjectID()
  let currentCreator = employeeId
  let namePrefix = 'Business Trip'

  let updateData = {
    budgetPassengers: [
      {
        _passenger: currentCreator,
        flight: {
          selected: true,
          departDate: '2019-06-15',
          returnDate: '2019-06-19',
          price: prices[0],
          departDestinationCode: 'HAN',
          departDestination: 'Noibai International',
          returnDestinationCode: 'SGN',
          returnDestination: 'Tan Son Nhat International',
          class: 'Economy',
          flightType: 'round-trip'
        },
        lodging: {
          selected: true,
          checkInDate: '2019-06-15',
          checkOutDate: '2019-06-19',
          price: prices[1],
          regionId: 6001380,
          regionName: 'Ernest Hemingway Home and Museum',
          class: 2
        },
        transportation: {
          selected: true,
          price: prices[2],
          limit: 50
        },
        meal: {
          selected: true,
          price: prices[3],
          limit: 700
        },
        others: {
          selected: true,
          amount: prices[4],
          reason: 'onaka ga suita'
        },
        totalPrice
      }
    ]
  }

  // 25 trips for employee 1
  if (i < 140) {
    if (tripIdsUser1[i]) {
      currentTripId = tripIdsUser1[i]
    } else {
      tripIdsUser1.push(currentTripId)
    }

    // 5 trips for employee 2
  } else if (i < 150) {
    currentCreator = employeeId2
    tripIdsUser2.push(currentTripId)

    // the rest is employee 1 personal trips
  } else {
    updateData = {
      businessTrip: false
    }
    namePrefix = 'Personal Trip'
  }

  let startDate = chance.date({ month: 11, year: 2019 })
  let startDateObj = new Date(startDate)
  let duration = chance.integer({ min: 1, max: 10 })
  let endDateObj = new Date(startDateObj.getTime() + duration * 86400000)

  let trip = {
    _id: currentTripId,
    name: `${namePrefix} ${i}`,
    status,
    _creator: currentCreator,
    _company: companyId,
    businessTrip: true,
    currency: 'USD',
    startDate: startDateObj,
    endDate: endDateObj,
    isBudgetUpdated: true,
    ...updateData,
    ...rejectedProps
  }
  trips.push(trip)
}

const expenses = []
const expenseStatuses = ['waiting', 'claiming', 'rejected', 'approved']
const expenseCategories = ['flight', 'lodging', 'transportation', 'meal']
const expenseAccounts = ['credit-card', 'cash']

for (let i = 0; i < 150; i++) {
  let rawAmount = chance.integer({ min: 0, max: 500 })
  expenses.push({
    _creator: employeeId,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: rawAmount,
    currency: 'USD',
    rawAmount,
    rawCurrency: 'USD',
    category: randomItemInArray(expenseCategories),
    transactionDate: new Date(chance.date({ year: 2019 })),
    _trip: randomItemInArray(tripIdsUser1),
    _company: companyId,
    account: randomItemInArray(expenseAccounts),
    receipts: ['1556164218511', '1556164218512'],
    message: chance.paragraph({ sentences: 1 }),
    city: chance.city(),
    vendor: chance.company(),
    _attendees: [employeeId2]
  })
}

for (let i = 150; i < 200; i++) {
  let rawAmount = chance.integer({ min: 0, max: 500 })
  expenses.push({
    _creator: employeeId2,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: rawAmount,
    rawAmount,
    currency: 'USD',
    rawCurrency: 'USD',
    category: randomItemInArray(expenseCategories),
    transactionDate: new Date(chance.date({ year: 2019 })),
    _trip: randomItemInArray(tripIdsUser2),
    _company: companyId,
    account: randomItemInArray(expenseAccounts),
    receipts: ['1556164218511', '1556164218512'],
    message: chance.paragraph({ sentences: 1 }),
    city: chance.city(),
    vendor: chance.company()
  })
}

const departments = [
  {
    _id: departmentId,
    _company: companyId,
    name: `Department 1`
  },
  {
    _id: departmentId2,
    _company: companyId,
    name: `Department 2`
  },
  {
    _id: departmentPartnerId,
    _company: companyPartnerId,
    name: `Partner - Department 1`
  },
  {
    _id: department2PartnerId,
    _company: companyPartnerId,
    name: `Partner - Department 2`
  },
  {
    _id: departmentPartnerId2,
    _company: companyPartnerId2,
    name: `Partner 2 - Department 1`
  }
]

for (let i = 2; i < 10; i++) {
  departments.push({
    _company: companyId,
    name: `Department ${i + 1}`
  })
}

const populateUsers = done => {
  return User.deleteMany({})
    .then(() => {
      let allUsers = users.map(user => new User(user))
      return Promise.all(allUsers.map(user => user.setPassword(password)))
    })
    .then(res => {
      return Promise.all(res.map(user => user.save()))
    })
}

const populatePartners = done => {
  return Partner.deleteMany({}).then(() => {
    let allParters = partners.map(partner => new Partner(partner))
    return Promise.all(allParters.map(partner => partner.save()))
  })
}

const populateCompanies = done => {
  return Company.deleteMany({}).then(() => {
    let allCompanies = companies.map(company => new Company(company))
    return Promise.all(allCompanies.map(company => company.save()))
  })
}

const populateExpenses = done => {
  return Expense.deleteMany({}).then(() => {
    let allCExpenses = expenses.map(expense => new Expense(expense))
    return Promise.all(allCExpenses.map(expense => expense.save()))
  })
}

const populateRoles = done => {
  return Role.deleteMany({}).then(() => {
    let allRoles = roles.map(role => new Role(role))
    return Promise.all(allRoles.map(role => role.save()))
  })
}

const populateRequests = done => {
  return Request.deleteMany({}).then(() => {
    let allRequests = requests.map(request => new Request(request))
    return Promise.all(allRequests.map(request => request.save()))
  })
}

const populatePolicies = () => {
  return Policy.deleteMany({}).then(() => {
    let allPolicies = policies.map(policy => new Policy(policy))
    return Promise.all(allPolicies.map(policy => policy.save()))
  })
}

const populateTrips = done => {
  return Trip.deleteMany({}).then(() => {
    let allTrips = trips.map(trip => new Trip(trip))
    return Promise.all(allTrips.map(trip => trip.save()))
  })
}

const populateDepartments = () => {
  return Department.deleteMany({}).then(() => {
    let allDepartments = departments.map(
      department => new Department(department)
    )
    return Promise.all(allDepartments.map(department => department.save()))
  })
}

let rewards = []
for (let i = 0; i < 50; i++) {
  let reward = {
    _id: new ObjectID(),
    title: chance.word({ syllables: 3 }),
    image: 'https://place-hold.it/320x160&text=product',
    brand: chance.company(),
    brandImage: 'https://place-hold.it/160x160&text=brand',
    categoryName: chance.company(),
    price: 200000,
    pricePoint: 200,
    currency: 'VND',
    content: chance.paragraph({ sentences: 5 }),
    note: chance.paragraph({ sentences: 3 }),
    office: [{ address: chance.city() }],
    supplier: 'ezbiztrip',
    country: chance.country()
  }
  if (i < 20) {
    reward = {
      ...reward,
      country: 'SG'
    }
  }
  rewards.push(reward)
}

const populateRewards = () => {
  return Reward.deleteMany({}).then(() => {
    let allRewards = rewards.map(reward => new Reward(reward))
    return Promise.all(allRewards.map(reward => reward.save()))
  })
}

let vouchers = []
for (let i = 0; i < 50; i++) {
  let voucher = {
    _id: new ObjectID(),
    title: chance.word({ syllables: 3 }),
    image: 'https://place-hold.it/320x160&text=product',
    brand: chance.company(),
    brandImage: 'https://place-hold.it/160x160&text=brand',
    categoryId: chance.company(),
    categoryName: chance.company(),
    price: 20000,
    customerInfo: {
      fullname: chance.first() + ' ' + chance.last(),
      email: chance.email(),
      phone: chance.phone()
    },
    siteUserId: '',
    transactionId: '',
    _buyer: employeeId,
    quantity: 1,
    pricePoint: 200,
    currency: 'VND',
    content: chance.paragraph({ sentences: 5 }),
    note: chance.paragraph({ sentences: 3 }),
    office: [{ address: chance.city() }],
    supplier: 'ezbiztrip',
    country: chance.country(),
    cartId: '',
    cartNumber: '',
    cartTotal: '',
    cartGiftLink: [''],
    cartGiftCode: ''
  }
  if (i < 20) {
    voucher = {
      ...voucher,
      country: 'SG'
    }
  }
  vouchers.push(voucher)
}

const populateVouchers = () => {
  return Voucher.deleteMany({}).then(() => {
    let allVouchers = vouchers.map(voucher => new Voucher(voucher))
    return Promise.all(allVouchers.map(voucher => voucher.save()))
  })
}

let options = [
  {
    name: 'hotel-markup',
    value: {
      type: 'percentage',
      amount: 10
    }
  },
  {
    name: 'flight-markup',
    value: {
      type: 'net',
      amount: 25
    }
  }
]

const populateOptions = () => {
  return Option.deleteMany({}).then(() => {
    let allOptions = options.map(option => new Option(option))
    return Promise.all(allOptions.map(option => option.save()))
  })
}

module.exports = {
  users,
  populateUsers,
  companies,
  populateCompanies,
  requests,
  populateRequests,
  policies,
  populatePolicies,
  trips,
  populateTrips,
  expenses,
  populateExpenses,
  roles,
  populateRoles,
  departments,
  populateDepartments,
  rewards,
  populateRewards,
  vouchers,
  populateVouchers,
  partners,
  populatePartners,
  options,
  populateOptions
}
