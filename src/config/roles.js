const CAN_ACCESS_BOOKING = 'CAN_ACCESS_BOOKING'
const CAN_ACCESS_BUDGET = 'CAN_ACCESS_BUDGET'
const CAN_ACCESS_EXPENSE = 'CAN_ACCESS_EXPENSE'
const CAN_ACCESS_ANALYTICS = 'CAN_ACCESS_ANALYTICS'
const CAN_ACCESS_REWARD = 'CAN_ACCESS_REWARD'
const CAN_ACCESS_COMPANY = 'CAN_ACCESS_COMPANY'

const permissions = [
  {
    permission: CAN_ACCESS_BOOKING,
    category: 'employee'
  },
  {
    permission: CAN_ACCESS_BOOKING,
    category: 'accountant'
  },
  {
    permission: CAN_ACCESS_EXPENSE,
    category: 'accountant'
  },
  {
    permission: CAN_ACCESS_BOOKING,
    category: 'manager'
  },
  {
    permission: CAN_ACCESS_ANALYTICS,
    category: 'manager'
  },
  {
    permission: CAN_ACCESS_BUDGET,
    category: 'manager'
  },
  {
    permission: CAN_ACCESS_REWARD,
    category: 'admin'
  },
  {
    permission: CAN_ACCESS_COMPANY,
    category: 'admin'
  }
]

const roles = [
  {
    name: 'Admin',
    type: 'admin',
    permissions: permissions
      .filter(p => p.category === 'admin')
      .map(p => p.permission)
  },
  {
    name: 'Manager',
    type: 'manager',
    permissions: permissions
      .filter(p => p.category === 'manager')
      .map(p => p.permission)
  },
  {
    name: 'Accountant',
    type: 'accountant',
    permissions: permissions
      .filter(p => p.category === 'accountant')
      .map(p => p.permission)
  },
  {
    name: 'Employee',
    type: 'employee',
    permissions: permissions
      .filter(p => p.category === 'employee')
      .map(p => p.permission)
  }
]

module.exports = { permissions, roles }
