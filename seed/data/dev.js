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
const tripId = new ObjectID('5cc2d7a24c72b61214af0051')
const tripId2 = new ObjectID('5cc2d7a24c72b61214af0052')
const tripId3 = new ObjectID('5cc2d7a24c72b61214af0053')
const tripId4 = new ObjectID('5cc2d7a24c72b61214af0054')
const tripId5 = new ObjectID('5cc2d7a24c72b61214af0055')
const tripId6 = new ObjectID('5cc2d7a24c72b61214af0056')
const tripId7 = new ObjectID('5cc2d7a24c72b61214af0057')
const tripId8 = new ObjectID('5cc2d7a24c72b61214af0000')
const departmentId = new ObjectID('5cd03b1571811c06ad420d36')
const secondDepartmentId = new ObjectID('5cd03b1571811c06ad420d35')
const tasAdminRoleId = new ObjectID()
const adminRoleId = new ObjectID()
const employeeRoleId = new ObjectID()
const password = '12345678'
const defaultPolicyId = new ObjectID()
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
    _role: randomItemInArray([adminRoleId, employeeRoleId]),
    _policy: randomItemInArray([policyId1, policyId2])
  })
}

const companies = [
  {
    _id: companyId,
    name: 'TAS',
    exchangedRate: 10,
    _policy: defaultPolicyId
  },
  {
    name: 'Microsoft'
  },
  {
    name: 'Apple'
  }
]

for (let i = 3; i < 50; i++) {
  companies.push({
    name: chance.company(),
    exchangedRate: 10
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
    _id: defaultPolicyId,
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
    provision: 5
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
  }
]

const trips = [
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
    departureFlight: {},
    returnFlight: {},
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
    returnDate: new Date('2019-03-25'),
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 15,
        lodging: 10,
        transportation: 150,
        meal: 210,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',

        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27'),
        totalPrice: 510,
        lastDestination: 'Singapore',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    _id: tripId2,
    name: 'Ha Long trip',
    status: 'completed',
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
    departureFlight: {},
    returnFlight: {},
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
    returnDate: new Date('2019-03-25'),
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 500,
        lodging: 1000,
        transportation: 1500,
        meal: 2000,
        provision: 5,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 5500,
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },
  {
    _id: tripId3,
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
    departureFlight: {},
    returnFlight: {},
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
    returnDate: new Date('2019-03-25'),
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 50000,
        lodging: 10000,
        transportation: 15000,
        meal: 20000,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 120000,
        destinations: [
          {
            from: 'HA NOI',
            date: new Date('2019-03-13')
          }
        ],
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },

  // second user trips
  {
    _id: tripId4,
    name: 'Ha Long trip 2',
    status: 'completed',
    _creator: employeeId2,
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
    departureFlight: {},
    returnFlight: {},
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
    returnDate: new Date('2019-03-25'),
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 5,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 55,
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },
  {
    _id: tripId5,
    name: 'Ha Long trip 3',
    status: 'completed',
    _creator: employeeId2,
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
    departureFlight: {},
    returnFlight: {},
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
    returnDate: new Date('2019-03-25'),
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 5,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 55,
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },
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
        lodging: 11,
        transportation: 15,
        meal: 22,
        provision: 25,
        totalPrice: 78,
        note: 'Large budget',
        classType: 'economy',
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },
  {
    _id: tripId6,
    name: 'Seoul trip',
    _creator: employeeId,
    status: 'approved',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 50,
        lodging: 10,
        transportation: 15,
        meal: 20,
        provision: 25,
        totalPrice: 125,
        note: 'Small budget',
        classType: 'economy',
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ]
  },
  {
    _id: tripId7,
    name: 'Singapore trip',
    _creator: employeeId,
    status: 'rejected',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 500,
        lodging: 10,
        transportation: 15,
        meal: 200,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 750,
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ],
    adminMessage:
      'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.',
    updatedByAdmin: adminId,
    updatedByAdminAt: new Date()
  },
  {
    _id: tripId8,
    name: 'Sydney trip',
    _creator: employeeId,
    status: 'finished',
    forCreator: true,
    _company: companyId,
    budgetPassengers: [
      {
        _passenger: employeeId,
        flight: 5000,
        lodging: 100,
        transportation: 150,
        meal: 2000,
        provision: 25,
        note: 'Small budget',
        classType: 'economy',
        totalPrice: 7500,
        lastDestination: 'Tan Son Nhat International',
        lastDestinationCode: 'SGN',
        lastDestinationDate: new Date('2019-07-17'),
        startDestination: 'Noibai International',
        startDestinationCode: 'HAN',
        startDestinationDate: new Date('2019-07-27')
      }
    ],
    updatedByAdmin: adminId,
    updatedByAdminAt: new Date()
  }
]

const expenses = []
const expenseStatuses = ['waiting', 'claiming', 'rejected', 'approved']
const expenseCategories = ['flight', 'lodging', 'transportation', 'meal']
const expenseAccounts = ['credit-card', 'cash']
const expenseTripsUser1 = [tripId, tripId2, tripId3, tripId6, tripId7, tripId8]

const expensesTripsUser2 = [tripId4, tripId5]

for (let i = 0; i < 150; i++) {
  expenses.push({
    _creator: employeeId,
    name: `Expense ${i + 1}`,
    status: randomItemInArray(expenseStatuses),
    amount: chance.integer({ min: 0, max: 500 }),
    category: randomItemInArray(expenseCategories),
    transactionDate: new Date(chance.date({ year: 2019 })),
    _trip: randomItemInArray(expenseTripsUser1),
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
    _trip: randomItemInArray(expensesTripsUser2),
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
