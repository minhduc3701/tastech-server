const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')
const Expense = require('../src/models/expense')

const {
  userToken,
  userCompany2Id,
  adminId,
  user2Id,
  tripWaitingId,
  tripApprovedId,
  setupDatabase,
  expenseWaitingId,
  expenseRejectedId
} = require('./fixtures/db.js')

beforeEach(setupDatabase)

test('Should create a new expense with valid trip and attendees', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId) + ',' + String(user2Id))
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(tripApprovedId))
    .field('account', 'cash')
    .expect(200)
})

test('Should not create a new expense with waiting trip', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(tripWaitingId))
    .field('account', 'cash')
    .expect(400)
})

test('Should not create a new expense with invalid trip', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(new mongoose.Types.ObjectId()))
    .field('account', 'cash')
    .expect(400)
})

test('Should not create a new expense with attendees of other company', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(userCompany2Id))
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(tripApprovedId))
    .field('account', 'cash')
    .expect(400)
})

test('Should not create a new expense with invalid attendees', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(new mongoose.Types.ObjectId()))
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(tripApprovedId))
    .field('account', 'cash')
    .expect(400)
})

test('Should not create a new expense with invalid attendees objectID', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', '1234,5678')
    .field('name', 'grab')
    .field('amount', '50')
    .field('currency', 'USD')
    .field('category', 'transportation')
    .field('transactionDate', '2019-03-16')
    .field('_trip', String(tripApprovedId))
    .field('account', 'cash')
    .expect(400)
})

// update expense test case

test('Should update expense with valid trip and attendees', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId) + ',' + String(user2Id))
    .field('_trip', String(tripApprovedId))
    .expect(200)
})

test('Should not update expense with waiting trip', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('_trip', String(tripWaitingId))
    .expect(400)
})

test('Should not update expense with invalid trip', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('_trip', String(new mongoose.Types.ObjectId()))
    .expect(400)
})

test('Should not update expense with attendees of other company', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(userCompany2Id))
    .field('_trip', String(tripApprovedId))
    .expect(400)
})

test('Should not update expense with invalid attendees', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(new mongoose.Types.ObjectId()))
    .field('_trip', String(tripApprovedId))
    .expect(400)
})

test('Should not update expense with invalid attendees objectID', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', '1234,5678')
    .field('_trip', String(tripApprovedId))
    .expect(400)
})

test('Should update expense with valid trip and attendees', async () => {
  await request(app)
    .patch(`/expenses/${expenseWaitingId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId) + ',' + String(user2Id))
    .field('_trip', String(tripApprovedId))
    .expect(200)
})

test('Should update expense from status rejected to waiting status', async () => {
  await request(app)
    .patch(`/expenses/${expenseRejectedId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_trip', String(tripApprovedId))
    .field('name', 'test name')
    .expect(200)

  let expense = await Expense.findById(expenseRejectedId)
  expect(expense.status === 'waiting')
})

test('Should not update expense from status rejected to any status except waiting ', async () => {
  await request(app)
    .patch(`/expenses/${expenseRejectedId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_trip', String(tripApprovedId))
    .field('status', 'claiming')
    .expect(200)

  let expense = await Expense.findById(expenseRejectedId)
  expect(expense.status === 'waiting')
})

test('Should update expense from status waiting to claiming status', async () => {
  await request(app)
    .patch(`/expenses`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      expenseIds: [expenseWaitingId]
    })
    .expect(200)

  let expense = await Expense.findById(expenseWaitingId)
  expect(expense.status === 'claiming')
})

test('Should not update expense from any status except waiting to claiming status', async () => {
  await request(app)
    .patch(`/expenses`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      expenseIds: [expenseRejectedId]
    })
    .expect(200)

  let expense = await Expense.findById(expenseRejectedId)
  expect(expense.status === 'rejected')
})
