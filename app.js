require('./config/config')
require('./config/mongoose')
require('./config/mail')
require('./config/aws')

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const passport = require('passport')
const requestsRouter = require('./routes/requests')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const tripsRouter = require('./routes/trips')
const expensesRouter = require('./routes/expenses')
const tasAdminUsersRouter = require('./routes/tas-admin/users')
const tasAdminCompaniesRouter = require('./routes/tas-admin/companies')
const tasAdminRequestsRouter = require('./routes/tas-admin/requests')
const adminCompanyRouter = require('./routes/admin/company')
const adminUsersRouter = require('./routes/admin/users')
const adminRolesRouter = require('./routes/admin/roles')
const adminPolicyRouter = require('./routes/admin/policies')
const adminDepartmentRouter = require('./routes/admin/departments')
const adminTripsRouter = require('./routes/admin/trips')
const adminExpensesRouter = require('./routes/admin/expenses')
const adminReportsRouter = require('./routes/admin/reports')
const flightsPkfareRouter = require('./routes/flights/pkfare')
const countriesRouter = require('./routes/countries')
const airportsRouter = require('./routes/airports')
const citiesRouter = require('./routes/cities')
const checkoutRouter = require('./routes/checkout')

const {
  authenticateTasAdmin,
  authenticateAdmin
} = require('./middleware/authenticate')

const app = express()
app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(cors())

app.use(passport.initialize())
require('./config/passport')

app.use('/auth', authRouter)
app.use('/requests', requestsRouter)
app.use('/users', passport.authenticate('jwt', { session: false }), usersRouter)
app.use('/trips', passport.authenticate('jwt', { session: false }), tripsRouter)
app.use(
  '/expenses',
  passport.authenticate('jwt', { session: false }),
  expensesRouter
)
// tas-admin routes
app.use(
  '/tas-admin/requests',
  passport.authenticate('jwt', { session: false }),
  authenticateTasAdmin,
  tasAdminRequestsRouter
)
app.use(
  '/tas-admin/users',
  passport.authenticate('jwt', { session: false }),
  authenticateTasAdmin,
  tasAdminUsersRouter
)
app.use(
  '/tas-admin/companies',
  passport.authenticate('jwt', { session: false }),
  authenticateTasAdmin,
  tasAdminCompaniesRouter
)

// admin routes
app.use(
  '/admin/company',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminCompanyRouter
)
app.use(
  '/admin/users',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminUsersRouter
)
app.use(
  '/admin/roles',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminRolesRouter
)
app.use(
  '/admin/trips',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminTripsRouter
)
app.use(
  '/admin/expenses',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminExpensesRouter
)
app.use(
  '/admin/policies',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminPolicyRouter
)
app.use(
  '/admin/departments',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminDepartmentRouter
)

app.use(
  '/admin/reports',
  passport.authenticate('jwt', { session: false }),
  authenticateAdmin,
  adminReportsRouter
)

// flights
app.use('/flights/pkfare', flightsPkfareRouter)

// content api
app.use('/countries', countriesRouter)
app.use(
  '/airports',
  passport.authenticate('jwt', { session: false }),
  airportsRouter
)
app.use(
  '/cities',
  passport.authenticate('jwt', { session: false }),
  citiesRouter
)

// checkout
app.use(
  '/checkout',
  passport.authenticate('jwt', { session: false }),
  checkoutRouter
)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500).send()
})

module.exports = app
