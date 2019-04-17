require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populateCompanies,
  populateRoles,
  populateRequests,
  populateBudgets,
  populateTrips
} = require('./seed')

Promise.all([
  populateUsers(),
  populateCompanies(),
  populateRoles(),
  populateRequests(),
  populateBudgets(),
  populateTrips()
]).then(res => {
  collections = ['users', 'companies', 'roles', 'requests', 'budgets', 'trips']
  collections.map((collection, index) => {
    console.log(`Imported ${res[index].length} ${collection}.`)
  })
  process.exit(0)
})
