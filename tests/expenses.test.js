const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')

const {
  userToken,
  userCompany2Id,
  adminId,
  user2Id,
  tripWaitingId,
  tripApprovedId,
  setupDatabase,
  expenseId
} = require('./fixtures/db.js')

beforeEach(setupDatabase)

// create expense test case
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

// update expense test case

test('Should update expense with valid trip and attendees', async () => {
  await request(app)
    .patch(`/expenses/${expenseId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId) + ',' + String(user2Id))
    .field('_trip', String(tripApprovedId))
    .expect(200)
})

test('Should not update expense with waiting trip', async () => {
  await request(app)
    .patch(`/expenses/${expenseId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('_trip', String(tripWaitingId))
    .expect(400)
})

test('Should not update expense with invalid trip', async () => {
  await request(app)
    .patch(`/expenses/${expenseId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(adminId))
    .field('_trip', String(new mongoose.Types.ObjectId()))
    .expect(400)
})

test('Should not update expense with attendees of other company', async () => {
  await request(app)
    .patch(`/expenses/${expenseId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(userCompany2Id))
    .field('_trip', String(tripApprovedId))
    .expect(400)
})

test('Should not update expense with invalid attendees', async () => {
  await request(app)
    .patch(`/expenses/${expenseId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .field('_attendees', String(new mongoose.Types.ObjectId()))
    .field('_trip', String(tripApprovedId))
    .expect(400)
})
