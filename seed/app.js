require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populateCompanies,
  populateRoles,
  populateRequests,
  populatePolicies,
  populateTrips,
  populateExpenses
} = require('./seed')

Promise.all([
  populateUsers(),
  populateCompanies(),
  populateRoles(),
  populateRequests(),
  populatePolicies(),
  populateTrips(),
  populateExpenses()
]).then(res => {
  collections = [
    'users',
    'companies',
    'roles',
    'requests',
    'policies',
    'trips',
    'expenses'
  ]
  collections.map((collection, index) => {
    console.log(`Imported ${res[index].length} ${collection}.`)
  })
  process.exit(0)
})
