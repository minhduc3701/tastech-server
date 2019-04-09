const { app } = require('../app')

const {
  users,
  populateUsers,
  companies,
  populateCompanies,
  requests,
  populateRequests,
  budgets,
  populateBudgets,
  trips,
  populateTrips
} = require('./seed')

populateUsers(() => {
  console.log(`Imported ${users.length} users.`)
})

populateCompanies(() => {
  console.log(`Imported ${companies.length} companies.`)
})

populateRequests(() => {
  console.log(`Imported ${companies.length} requests.`)
})

populateBudgets(() => {
  console.log(`Imported ${budgets.length} budgets.`)
})

populateTrips(() => {
  console.log(`Imported ${trips.length} trips.`)
})
