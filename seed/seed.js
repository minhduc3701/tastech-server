const { ObjectID } = require('mongodb')
const User = require('../models/user')
const Company = require('../models/company')
const Request = require('../models/request')
const Budget = require('../models/budget')
const Policy = require('../models/policy')
const Trip = require('../models/trip')

const tasAdminId = new ObjectID()
const adminId = new ObjectID()
const employeeId = new ObjectID()
const companyId = new ObjectID()
const budgetId = new ObjectID()
const secondBudgetId = new ObjectID()
const policyId = new ObjectID()
const secondPolicyId = new ObjectID()
const thirdPolicyId = new ObjectID()
const password = '12345678'

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
    _id: new ObjectID(),
    username: 'employee2@tastech.asia',
    email: 'employee2@tastech.asia',
    type: 'employee',
    _company: companyId
  }
]

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
    status: 'processed'
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
    status: 'waiting'
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
  }
]

const budgets = [
  {
    _id: budgetId,
    name: 'Budget to Sai Gon',
    _creator: employeeId,
    status: 'approved',
    forCreator: true,
    _company: companyId,
    passengers: [
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
          },
          {
            from: 'DA NANG',
            date: new Date('2019-03-16')
          }
        ],
        lastDestination: 'HO CHI MINH',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    _id: secondBudgetId,
    name: 'Budget to Thai Land',
    _creator: employeeId,
    status: 'approved',
    forCreator: true,
    _company: companyId,
    passengers: [
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
            from: 'HANOI',
            date: new Date('2019-03-13')
          },
          {
            from: 'BANGKOK',
            date: new Date('2019-03-16')
          }
        ],
        lastDestination: 'HANOI',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  },
  {
    name: 'Budget to Japan',
    _creator: employeeId,
    status: 'waiting',
    forCreator: true,
    _company: companyId,
    passengers: [
      {
        _passenger: employeeId,
        flight: 3000,
        lodging: 100,
        transportation: 150,
        meal: 2000,
        provision: 0,
        note: 'Large budget',
        classType: 'economy',
        destinations: [
          {
            from: 'HA NOI',
            date: new Date('2019-03-13')
          },
          {
            from: 'HO CHI MINH',
            date: new Date('2019-03-16')
          }
        ],
        lastDestination: 'JAPAN',
        lastDestinationDate: new Date('2019-03-17')
      }
    ]
  }
]

const policies = [
  {
    _id: policyId,
    name: 'Travel Policy for Manager',
    _company: companyId,
    flightClass: 'business',
    stops: '1 stop',
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
    provision: 5,
    employees: [employeeId]
  },
  {
    _id: secondPolicyId,
    name: 'Travel Policy for Staff',
    _company: companyId,
    flightClass: 'economy',
    stops: '1+ stop',
    setDaysBeforeFlights: false,
    daysBeforeFlights: 0,
    setFlightLimit: false,
    flightLimit: 0,
    flightNotification: 'over',
    flightApproval: 'over',
    hotelClass: 3,
    hotelSearchDistance: 10,
    setDaysBeforeLodging: false,
    daysBeforeLodging: 0,
    setHotelLimit: false,
    hotelLimit: 0,
    hotelNotification: 'over',
    hotelApproval: 'over',
    setTransportLimit: false,
    transportLimit: 0,
    setMealLimit: false,
    mealLimit: 0,
    provision: 10,
    employees: [employeeId]
  },
  {
    _id: thirdPolicyId,
    name: 'Travel Policy for Director',
    _company: companyId,
    flightClass: 'economy',
    stops: '1+ stop',
    setDaysBeforeFlights: false,
    daysBeforeFlights: 0,
    setFlightLimit: false,
    flightLimit: 0,
    flightNotification: 'all',
    flightApproval: 'all',
    hotelClass: 3,
    hotelSearchDistance: 10,
    setDaysBeforeLodging: false,
    daysBeforeLodging: 0,
    setHotelLimit: false,
    hotelLimit: 0,
    hotelNotification: 'all',
    hotelApproval: 'all',
    setTransportLimit: false,
    transportLimit: 0,
    setMealLimit: false,
    mealLimit: 0,
    provision: 10,
    employees: [employeeId]
  }
]

const trips = [
  {
    name: 'HO CHI MINH trip',
    status: 'ongoing',
    _creator: employeeId,
    _budget: budgetId,
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
    name: 'ThaiLand trip',
    status: 'finished',
    _creator: employeeId,
    _budget: secondBudgetId,
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

const populateRequests = done => {
  return Request.deleteMany({}).then(() => {
    let allRequests = requests.map(request => new Request(request))
    return Promise.all(allRequests.map(request => request.save()))
  })
}

const populateBudgets = () => {
  return Budget.deleteMany({}).then(() => {
    let allBudgets = budgets.map(budget => new Budget(budget))
    return Promise.all(allBudgets.map(budget => budget.save()))
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

module.exports = {
  users,
  populateUsers,
  companies,
  populateCompanies,
  requests,
  populateRequests,
  budgets,
  populateBudgets,
  policies,
  populatePolicies,
  trips,
  populateTrips
}
