require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populateCompanies,
  populateRoles,
  populateRequests,
  populateBudgets,
  populatePolicies,
  populateTrips
} = require('./seed')

Promise.all([
  populateUsers(),
  populateCompanies(),
  populateRoles(),
  populateRequests(),
  populateBudgets(),
  populatePolicies(),
  populateTrips()
]).then(res => {
  collections = ['users', 'companies', 'roles', 'requests', 'budgets', 'policies', 'trips']
  collections.map((collection, index) => {
    console.log(`Imported ${res[index].length} ${collection}.`)
  })
  process.exit(0)
})
