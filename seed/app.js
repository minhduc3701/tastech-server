require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populateCompanies,
  populateRequests,
  populateBudgets,
  populateTrips,
  populateExpenses
} = require('./seed')

Promise.all([
  populateUsers(),
  populateCompanies(),
  populateRequests(),
  populateBudgets(),
  populateTrips(),
  populateExpenses()
]).then(res => {
  collections = [
    'users',
    'companies',
    'requests',
    'budgets',
    'trips',
    'expenses'
  ]
  collections.map((collection, index) => {
    console.log(`Imported ${res[index].length} ${collection}.`)
  })
  process.exit(0)
})
