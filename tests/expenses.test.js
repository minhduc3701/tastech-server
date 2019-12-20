const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')

const {
  userOneToken,
  userOneId,
  userCompany2Id,
  adminOneId,
  tripWaitingId,
  tripApprovedId,
  setupDatabase
} = require('./fixtures/db.js')

beforeEach(setupDatabase)

test('Should create a new expense with valid trip and attendees', async () => {
  await request(app)
    .post('/expenses')
    .set('Authorization', `Bearer ${userOneToken}`)
    .field('_creator', String(userOneId))
    .field('_attendees', String(adminOneId))
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
    .set('Authorization', `Bearer ${userOneToken}`)
    .field('_creator', String(userOneId))
    .field('_attendees', String(adminOneId))
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
    .set('Authorization', `Bearer ${userOneToken}`)
    .field('_creator', String(userOneId))
    .field('_attendees', String(adminOneId))
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
    .set('Authorization', `Bearer ${userOneToken}`)
    .field('_creator', String(userOneId))
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
    .set('Authorization', `Bearer ${userOneToken}`)
    .field('_creator', String(userOneId))
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
