require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populateCompanies,
  populateRoles,
  populateRequests,
  populateTrips,
  populateExpenses
} = require('./seed')

Promise.all([
  populateUsers(),
  populateCompanies(),
  populateRoles(),
  populateRequests(),
  populateTrips(),
  populateExpenses()
]).then(res => {
  collections = ['users', 'companies', 'roles', 'requests', 'trips', 'expenses']
  collections.map((collection, index) => {
    console.log(`Imported ${res[index].length} ${collection}.`)
  })
  process.exit(0)
})
