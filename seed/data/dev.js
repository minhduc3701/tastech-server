const { ObjectID } = require('mongodb')
const User = require('../../models/user')
const Company = require('../../models/company')
const Role = require('../../models/role')
const Request = require('../../models/request')
const Policy = require('../../models/policy')
const Department = require('../../models/department')
const Trip = require('../../models/trip')
const Expense = require('../../models/expense')
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
const secondDepartmentId = new ObjectID('5cd03b1571811c06ad420d35')
const tasAdminRoleId = new ObjectID('5cc2d7a24c72b61214af0058')
const adminRoleId = new ObjectID('5cc2d7a24c72b61214af0059')
const adminRoleId2 = new ObjectID()
const adminRoleId3 = new ObjectID()
const employeeRoleId = new ObjectID('5cc2d7a24c72b61214af0060')
const employeeRoleId2 = new ObjectID()
const employeeRoleId3 = new ObjectID()
const password = '12345678'
const defaultPolicyId = new ObjectID()
const defaultPolicyId2 = new ObjectID()
const defaultPolicyId3 = new ObjectID()
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
    avatar: `http://i.pravatar.cc/150?img=1`,
    _role: tasAdminRoleId
  },
  {
    _id: adminId,
    username: 'admin@tastech.asia',
    email: 'admin@tastech.asia',
    _company: companyId,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRoleId
  },
  {
    _id: employeeId,
    username: 'employee@tastech.asia',
    email: 'employee@tastech.asia',
    _company: companyId,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: employeeRoleId,
    firstName: chance.first(),
    lastName: chance.last(),
    _department: departmentId
  },
  {
    _id: employeeId2,
    username: 'employee2@tastech.asia',
    email: 'employee2@tastech.asia',
    _company: companyId,
    avatar: `http://i.pravatar.cc/150?img=4`,
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
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRoleId2
  },
  {
    username: 'e1c2@tastech.asia',
    email: 'e1c2@tastech.asia',
    _company: companyId2,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: employeeRoleId2,
    firstName: chance.first(),
    lastName: chance.last()
  },

  // admin, employee for company 3
  {
    username: 'a1c3@tastech.asia',
    email: 'a1c3@tastech.asia',
    _company: companyId3,
    avatar: `http://i.pravatar.cc/150?img=2`,
    _role: adminRoleId3
  },
  {
    username: 'e1c3@tastech.asia',
    email: 'e1c3@tastech.asia',
    _company: companyId3,
    avatar: `http://i.pravatar.cc/150?img=3`,
    _role: employeeRoleId3,
    firstName: chance.first(),
    lastName: chance.last()
  }
]

for (let i = 4; i < 50; i++) {
  let email = `employee${i - 1}@tastech.asia`

  users.push({
    _id: new ObjectID(),
    username: email,
    email,
    _company: companyId,
    firstName: chance.first(),
    lastName: chance.last(),
    avatar: `http://i.pravatar.cc/150?img=${i + 1}`,
    _department: randomItemInArray([departmentId, secondDepartmentId]),
    _role: employeeRoleId,
    _policy: randomItemInArray([policyId1, policyId2])
  })
}

const companies = [
  {
    _id: companyId,
    name: 'TAS',
    exchangedRate: 10,
    _policy: defaultPolicyId,
    currency: 'VND'
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
    currency: 'USD'
  }
]

const roles = [
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
    permissions: ['CAN_EDIT_USER'],
    _company: companyId
  },
  {
    _id: employeeRoleId,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_CLAIM_EXPRENSE'],
    _company: companyId
  },

  // company 2 roles
  {
    _id: adminRoleId2,
    name: 'Admin',
    type: 'admin',
    permissions: ['CAN_EDIT_USER'],
    _company: companyId2
  },
  {
    _id: employeeRoleId2,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_CLAIM_EXPRENSE'],
    _company: companyId2
  },

  // company 3 roles
  {
    _id: adminRoleId3,
    name: 'Admin',
    type: 'admin',
    permissions: ['CAN_EDIT_USER'],
    _company: companyId3
  },
  {
    _id: employeeRoleId3,
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_CLAIM_EXPRENSE'],
    _company: companyId3
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
  flightClass: 'business',
  stops: '0',
  setDaysBeforeFlights: true,
  daysBeforeFlights: 7,
  setFlightLimit: true,
  flightLimit: 2000,
  flightNotification: 'no',
  flightApproval: 'no',
  hotelClass: 3,
  hotelSearchDistance: 10,
  setDaysBeforeLodging: true,
  daysBeforeLodging: 7,
  setHotelLimit: true,
  hotelLimit: 5000,
  hotelNotification: 'no',
  hotelApproval: 'no',
  setTransportLimit: true,
  transportLimit: 100,
  setMealLimit: true,
  mealLimit: 100,
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
    flightClass: 'economy',
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
    flightClass: 'economy',
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
  }
]

const trips = []
const tripStatus = [
  'waiting',
  'approved',
  'rejected',
  'ongoing',
  'finished',
  'completed'
]

for (let i = 0; i < 30; i++) {
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
  let currentTripId
  let currentCreator = employeeId

  // 25 trips for employee 1
  if (i < 25) {
    if (tripIdsUser1[i]) {
      currentTripId = tripIdsUser1[i]
    } else {
      currentTripId = new ObjectID()
      tripIdsUser1.push(currentTripId)
    }

    // 5 trips for employee 2
  } else {
    currentCreator = employeeId2
    currentTripId = new ObjectID()
    tripIdsUser2.push(currentTripId)
  }

  let trip = {
    _id: currentTripId,
    name: `Business Trip ${i}`,
    status,
    _creator: currentCreator,
    _company: companyId,
    businessTrip: true,
    currency: 'VND',
    startDate: new Date('2019-03-20'),
    endDate: new Date('2019-03-25'),
    isBudgetUpdated: true,
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
          class: 'economy',
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
    ],
    ...rejectedProps
  }
  trips.push(trip)
}

const expenses = []
const expenseStatuses = ['waiting', 'claiming', 'rejected', 'approved']
const expenseCategories = ['flight', 'lodging', 'transportation', 'meal']
const expenseAccounts = ['credit-card', 'cash']

for (let i = 0; i < 150; i++) {
  expenses.push({
    _creator: employeeId,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: chance.integer({ min: 0, max: 500 }),
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
  expenses.push({
    _creator: employeeId2,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: chance.integer({ min: 0, max: 500 }),
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
    _id: secondDepartmentId,
    _company: companyId,
    name: `Department 2`
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
  populateDepartments
}
