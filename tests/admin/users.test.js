const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const {
  userOneId,
  adminOneToken,
  setupDatabase,
  employeeRoleId,
  departmentId,
  policyId,
  tasAdminRoleId
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// Create user
test('Should create a new user with valid role, department, policy in company', async () => {
  await request(app)
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .patch(`/admin/users/${userOneId}`)
    .set('Authorization', `Bearer ${adminOneToken}`)
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
    .patch(`/admin/users/${userOneId}`)
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _role: tasAdminRoleId
    })
    .expect(400)
})

test('Should not edit user with non-exist role in company', async () => {
  await request(app)
    .patch(`/admin/users/${userOneId}`)
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _role: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not edit user with non-exist department in company', async () => {
  await request(app)
    .patch(`/admin/users/${userOneId}`)
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _department: new mongoose.Types.ObjectId()
    })
    .expect(400)
})

test('Should not edit user with non-exist policy in company', async () => {
  await request(app)
    .patch(`/admin/users/${userOneId}`)
    .set('Authorization', `Bearer ${adminOneToken}`)
    .send({
      firstName: 'Ha',
      lastName: 'Phan',
      _policy: new mongoose.Types.ObjectId()
    })
    .expect(400)
})
