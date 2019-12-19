const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const {
  adminOneToken,
  setupDatabase,
  employeeRoleId,
  company1Department1Id
} = require('../fixtures/db.js')

beforeEach(setupDatabase)
test('Create new user', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      email: 'newUser@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _role: employeeRoleId,
      _department: company1Department1Id
    })
    .expect(200)
})

test('Create new user with wrong Role', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      email: 'wrongRole@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _role: new mongoose.Types.ObjectId()
    })
    .expect(404)
})

test('Create new user with wrong Department', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      email: 'wrongDepartment@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _department: new mongoose.Types.ObjectId()
    })
    .expect(404)
})

test('Create new user with wrong Policy', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      email: 'wrongPolicy@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _policy: new mongoose.Types.ObjectId()
    })
    .expect(404)
})
