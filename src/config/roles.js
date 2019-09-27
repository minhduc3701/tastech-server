const CAN_ACCESS_BOOKING = 'CAN_ACCESS_BOOKING'
const CAN_ACCESS_BUDGET = 'CAN_ACCESS_BUDGET'
const CAN_ACCESS_EXPENSE = 'CAN_ACCESS_EXPENSE'
const CAN_ACCESS_ANALYTICS = 'CAN_ACCESS_ANALYTICS'
const CAN_ACCESS_REWARD = 'CAN_ACCESS_REWARD'
const CAN_ACCESS_COMPANY = 'CAN_ACCESS_COMPANY'

const permissions = [
  {
    permission: CAN_ACCESS_BOOKING,
    roles: ['employee', 'accountant', 'manager', 'admin']
  },
  {
    permission: CAN_ACCESS_EXPENSE,
    roles: ['accountant', 'admin']
  },
  {
    permission: CAN_ACCESS_ANALYTICS,
    roles: ['manager', 'admin']
  },
  {
    permission: CAN_ACCESS_BUDGET,
    roles: ['manager', 'admin']
  },
  {
    permission: CAN_ACCESS_REWARD,
    roles: ['admin']
  },
  {
    permission: CAN_ACCESS_COMPANY,
    roles: ['admin']
  }
]

const roles = [
  {
    name: 'Admin',
    type: 'admin',
    permissions: permissions
      .filter(p => p.roles.includes('admin'))
      .map(p => p.permission)
  },
  {
    name: 'Manager',
    type: 'manager',
    permissions: permissions
      .filter(p => p.roles.includes('manager'))
      .map(p => p.permission)
  },
  {
    name: 'Accountant',
    type: 'accountant',
    permissions: permissions
      .filter(p => p.roles.includes('accountant'))
      .map(p => p.permission)
  },
  {
    name: 'Employee',
    type: 'employee',
    permissions: permissions
      .filter(p => p.roles.includes('employee'))
      .map(p => p.permission)
  }
]

module.exports = {
  CAN_ACCESS_BUDGET,
  CAN_ACCESS_EXPENSE,
  permissions,
  roles
}
