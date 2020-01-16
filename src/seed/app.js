require('../config/config')
require('../config/mongoose')

const {
  populateUsers,
  populatePartners,
  populateCompanies,
  populateRoles,
  populateRequests,
  populatePolicies,
  populateTrips,
  populateExpenses,
  populateDepartments,
  populateRewards,
  populateVouchers,
  populateOptions
} = require('./data/dev')

const yargs = require('yargs')

const argv = yargs
  .options({
    c: {
      alias: 'collections',
      describe: 'Collections to seed',
      array: true,
      default: 'all'
    }
  })
  .help()
  .alias('help', 'h').argv

let seedCollections = argv.c

let collections = [
  {
    collection: 'users',
    population: populateUsers
  },
  {
    collection: 'companies',
    population: populateCompanies
  },
  {
    collection: 'roles',
    population: populateRoles
  },
  {
    collection: 'requests',
    population: populateRequests
  },
  {
    collection: 'policies',
    population: populatePolicies
  },
  {
    collection: 'trips',
    population: populateTrips
  },
  {
    collection: 'expenses',
    population: populateExpenses
  },
  {
    collection: 'departments',
    population: populateDepartments
  },
  {
    collection: 'rewards',
    population: populateRewards
  },
  {
    collection: 'vouchers',
    population: populateVouchers
  },
  {
    collection: 'partners',
    population: populatePartners
  },
  {
    collection: 'options',
    population: populateOptions
  }
]

// not all collections
if (seedCollections.findIndex(sc => sc === 'all') < 0) {
  collections = collections.filter(
    c => seedCollections.findIndex(sc => sc === c.collection) >= 0
  )
}

Promise.all(collections.map(c => c.population())).then(res => {
  collections
    .map(c => c.collection)
    .map((collection, index) => {
      console.log(`Imported ${res[index].length} ${collection}.`)
    })
  process.exit(0)
})
