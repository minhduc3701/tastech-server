const permissions = [
  {
    permission: 'CAN_VIEW_SETTING',
    category: 'setting'
  },
  {
    permission: 'CAN_EDIT_SETTING',
    category: 'setting'
  },
  {
    permission: 'CAN_APPROVE_ESTIMATION_CREATION',
    category: 'approval'
  },
  {
    permission: 'CAN_APPROVE_EXPENSE',
    category: 'approval'
  },
  {
    permission: 'CAN_CREATE_TRIP',
    category: 'booking'
  },
  {
    permission: 'CAN_MANAGE_TRAVEL',
    category: 'booking'
  },
  {
    permission: 'CAN_CLAIM_EXPRENSE',
    category: 'booking'
  },
  {
    permission: 'CAN_VIEW_USER',
    category: 'administration'
  },
  {
    permission: 'CAN_EDIT_USER',
    category: 'administration'
  },
  {
    permission: 'CAN_EDIT_BOOKING',
    category: 'administration'
  }
]

const roles = [
  {
    name: 'Admin',
    type: 'admin',
    permissions: ['CAN_EDIT_USER']
  },
  {
    name: 'Employee',
    type: 'employee',
    permissions: ['CAN_CLAIM_EXPRENSE']
  }
]

module.exports = { permissions, roles }
