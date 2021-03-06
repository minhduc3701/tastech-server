const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const {
  userId,
  adminToken,
  setupDatabase,
  employeeRoleId,
  departmentId,
  policyId,
  tasAdminRoleId
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

// Create user
test('Should create a new user with valid role, department, policy in company', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'newUser@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _role: employeeRoleId,
      _department: departmentId,
      _policy: policyId
    })
    .expect(200)
})

test('Should not create new employee with tas-admin role', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'newUser@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _role: tasAdminRoleId,
      _department: departmentId,
      _policy: policyId
    })
    .expect(400)
})

test('Should not create new user with non-exist role in company', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'wrongRole@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _role: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not create new user with non-exist department in company', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'wrongDepartment@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _department: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not create new user with non-exist policy in company', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'wrongPolicy@tastech.asia',
      password: '12345678',
      firstName: 'Ha',
      lastName: 'Phan',
      _policy: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

// Update User

test('Should edit user with existing role, department, policy in company', async () => {
  await request(app)
    .patch(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _role: employeeRoleId,
      _department: departmentId,
      _policy: policyId
    })
    .expect(200)
})

test('Should not edit user with tas-admin role in company', async () => {
  await request(app)
    .patch(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _role: tasAdminRoleId
    })
    .expect(400)
})

test('Should not edit user with non-exist role in company', async () => {
  await request(app)
    .patch(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _role: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not edit user with non-exist department in company', async () => {
  await request(app)
    .patch(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _department: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not edit user with non-exist policy in company', async () => {
  await request(app)
    .patch(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _policy: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should get all users without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/users`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.users.map(user => {
    expect(user).not.toHaveProperty('resetPasswordToken')
    expect(user).not.toHaveProperty('resetPasswordExpires')
  })
})

test('Should get user without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/users/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.user).not.toHaveProperty('resetPasswordToken')
  expect(res.body.user).not.toHaveProperty('resetPasswordExpires')
})
