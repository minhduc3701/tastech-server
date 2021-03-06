const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const Expense = require('../../src/models/expense')

const {
  adminToken,
  setupDatabase,
  expenseWaitingId,
  expenseClaimingId,
  expenseApprovedId,
  expenseRejectedId
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

test('Should update expense from status claiming to approved status', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseClaimingId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'approved'
    })
    .expect(200)

  let expense = await Expense.findById(expenseClaimingId)
  expect(expense.status === 'approved')
})

test('Should update expense from status claiming to rejected status', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseClaimingId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'rejected'
    })
    .expect(200)

  let expense = await Expense.findById(expenseClaimingId)
  expect(expense.status === 'rejected')
})

test('Should not update expense with invalid expenseId', async () => {
  await request(app)
    .patch(`/admin/expenses/012345678`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'rejected'
    })
    .expect(404)
})

test('Should not update expense from status claiming to waiting status', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseClaimingId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'waiting'
    })
    .expect(400)
})

test('Should not update approved expense ', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseApprovedId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'rejected'
    })
    .expect(404)
})

test('Should not update rejected expense ', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseRejectedId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'approved'
    })
    .expect(404)
})

test('Should not update waiting expense ', async () => {
  await request(app)
    .patch(`/admin/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      status: 'approved'
    })
    .expect(404)
})
