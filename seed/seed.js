const { ObjectID } = require('mongodb')
const User = require('../models/user')
const Company = require('../models/company')
const Role = require('../models/role')
const Request = require('../models/request')
const Policy = require('../models/policy')
const Department = require('../models/department')
const Trip = require('../models/trip')
const Expense = require('../models/expense')
const Change = require('chance')
const chance = new Change()

const tasAdminId = new ObjectID('5cc2d7a24c72b61214af0049')
const adminId = new ObjectID('5cc2d7a24c72b61214af004a')
const employeeId = new ObjectID('5cc2d7a24c72b61214af004b')
const employeeId2 = new ObjectID('5cc2d7a24c72b61214af004c')
const companyId = new ObjectID('5cc2d7a24c72b61214af004d')
const tripId = new ObjectID('5cc2d7a24c72b61214af0051')
const secondTripId = new ObjectID('5cc2d7a24c72b61214af0052')
const password = '12345678'

const randomItemInArray = items =>
  items[Math.floor(Math.random() * items.length)]

const users = [
  {
    _id: tasAdminId,
    username: 'tas-admin@tastech.asia',
    email: 'tas-admin@tastech.asia',
    type: 'tas-admin'
  },
  {
    _id: adminId,
    username: 'admin@tastech.asia',
    email: 'admin@tastech.asia',
    type: 'admin',
    _company: companyId
  },
  {
    _id: employeeId,
    username: 'employee@tastech.asia',
    email: 'employee@tastech.asia',
    type: 'employee',
    _company: companyId
  },
  {
    _id: employeeId2,
    username: 'employee2@tastech.asia',
    email: 'employee2@tastech.asia',
    type: 'employee',
    _company: companyId
  }
]

const userTypes = ['employee', 'admin']

for (let i = 0; i < 46; i++) {
  let email = chance.email({ domain: 'tastech.asia' })
  if (users.findIndex(user => user.email === email) >= 0) {
    i -= 1
  } else {
    users.push({
      username: email,
      email,
      type: randomItemInArray(userTypes),
      _company: companyId,
      firstName: chance.first(),
      lastName: chance.last(),
      avatar: `http://i.pravatar.cc/150?img=${i}`
    })
  }
}

const companies = [
  {
    _id: companyId,
    name: 'TAS'
  },
  {
    name: 'Microsoft'
  },
  {
    name: 'Apple'
  }
]

for (let i = 0; i < 47; i++) {
  companies.push({
    name: chance.company()
  })
}

const roles = [
  {
    name: 'Admin',
    type: 'admin',
    permissions: ['CAN_EDIT_USER'],
    _company: companyId
  },
  {
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_CLAIM_EXPRENSE'],
    _company: companyId
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

const policies = [
  {
    name: 'Default Policy',
    _company: companyId,
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
    provision: 5,
    employees: [employeeId]
  },
  {
    name: 'Travel Policy for Staff',
    _company: companyId,
    status: 'enable',
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
    provision: 10,
    employees: [employeeId]
  },
  {
    name: 'Travel Policy for Director',
    _company: companyId,
    status: 'disable',
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
    provision: 10,
    employees: [employeeId]
  }
]

const trips = [
  {
    name: 'New York trip',
    _creator: employeeId,
    status: 'waiting',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 25,
        note: 'Large budget',
        classType: 'economy',
        destinations: [
          {
            from: 'HA NOI',
            date: new Date('2019-03-13')
          }
        ],
        lastDestination: 'New York',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    name: 'Seoul trip',
    _creator: employeeId,
    status: 'approved',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',
        destinations: [
          {
            from: 'HA NOI',
            date: new Date('2019-03-13')
          }
        ],
        lastDestination: 'Seoul',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    name: 'Singapore trip',
    _creator: employeeId,
    status: 'rejected',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',
        destinations: [
          {
            from: 'HA NOI',
            date: new Date('2019-03-13')
          }
        ],
        lastDestination: 'Singapore',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    _id: tripId,
    name: 'HO CHI MINH trip',
    status: 'ongoing',
    _creator: employeeId,
    _company: companyId,
    checkoutStatus: 'completed', // pending, completed, canceled
    hotelCode: 'AROMA',
    rooms: [
      {
        price: 1000,
        roomType: 'DOUBLE',
        numberRooms: 1
      },
      {
        price: 800,
        roomType: 'SINGLE',
        numberRooms: 3
      }
    ],
    departFlights: [
      {
        price: 500,
        departTime: new Date('2019-03-20 08:00'),
        arrivalTime: new Date('2019-03-20 10:00'),
        airline: 'VN',
        flightCode: 'VNA29175',
        ticketCode: 'JJQQKK'
      }
    ],
    returnFlights: [
      {
        price: 500,
        departTime: new Date('2019-03-25 15:00'),
        arrivalTime: new Date('2019-03-25 17:00'),
        airline: 'VN',
        flightCode: 'VNA29185',
        ticketCode: 'JJQQKK'
      }
    ],
    passengers: [
      {
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        firstName: 'Jane',
        lastName: 'Doe'
      }
    ],
    payment: 'card',
    roundTrip: true,
    numberPassengers: 5,
    flightClass: 'economy',
    departure: 'HANOI',
    departureDate: new Date('2019-03-20'),
    arrival: 'HO CHI MINH',
    returnDate: new Date('2019-03-25')
  },
  {
    _id: secondTripId,
    name: 'ThaiLand trip',
    status: 'finished',
    _creator: employeeId,
    _company: companyId,
    checkoutStatus: 'completed', // pending, completed, canceled
    hotelCode: 'BANGKOKHOTL',
    rooms: [
      {
        price: 1000,
        roomType: 'DOUBLE',
        numberRooms: 1
      },
      {
        price: 800,
        roomType: 'SINGLE',
        numberRooms: 3
      }
    ],
    departFlights: [
      {
        price: 500,
        departTime: new Date('2019-03-20 08:00'),
        arrivalTime: new Date('2019-03-20 10:00'),
        airline: 'VN',
        flightCode: 'VNA29175',
        ticketCode: 'JJQQKK'
      }
    ],
    returnFlights: [
      {
        price: 500,
        departTime: new Date('2019-03-25 15:00'),
        arrivalTime: new Date('2019-03-25 17:00'),
        airline: 'VN',
        flightCode: 'VNA29185',
        ticketCode: 'JJQQKK'
      }
    ],
    passengers: [
      {
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        firstName: 'Jane',
        lastName: 'Doe'
      }
    ],
    payment: 'card',
    roundTrip: true,
    numberPassengers: 5,
    flightClass: 'economy',
    departure: 'HANOI',
    departureDate: new Date('2019-03-20'),
    arrival: 'BANGKOK',
    returnDate: new Date('2019-03-25')
  }
]

const expenses = []
const expenseStatuses = ['waiting', 'claiming', 'rejected', 'approved']
const expenseCategories = ['flight', 'lodging', 'transportation', 'meal']
const expenseAccounts = ['credit-card', 'cash']
const expenseTrips = [tripId, secondTripId]

for (let i = 0; i < 50; i++) {
  expenses.push({
    _creator: employeeId,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: chance.integer({ min: 0, max: 500 }),
    category: randomItemInArray(expenseCategories),
    transactionDate: new Date(chance.date({ year: 2019 })),
    status: randomItemInArray(expenseStatuses),
    _trip: randomItemInArray(expenseTrips),
    _company: companyId,
    account: randomItemInArray(expenseAccounts),
    receipts: ['1556164218511', '1556164218512'],
    message: chance.paragraph({ sentences: 1 }),
    city: chance.city(),
    vendor: chance.company(),
    _attendees: [employeeId2]
  })
}

const departments = []
for (let i = 0; i < 10; i++) {
  departments.push({
    _company: companyId,
    name: `Department ${i + 1}`,
    employees: [employeeId, employeeId2]
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
