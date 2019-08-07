require('./config/config')
require('./config/mongoose')
require('./config/mail')
require('./config/aws')
require('./config/schedule')

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
const tasAdminOrdersRouter = require('./routes/tas-admin/orders')
const adminCompanyRouter = require('./routes/admin/company')
const adminUsersRouter = require('./routes/admin/users')
const adminRolesRouter = require('./routes/admin/roles')
const adminPolicyRouter = require('./routes/admin/policies')
const adminDepartmentRouter = require('./routes/admin/departments')
const adminTripsRouter = require('./routes/admin/trips')
const adminExpensesRouter = require('./routes/admin/expenses')
const adminReportsRouter = require('./routes/admin/reports')
const flightsPkfareRouter = require('./routes/flights/pkfare')
const flightsSabreRouter = require('./routes/flights/sabre')
const hotelsPkfareRouter = require('./routes/hotels/pkfare')
const hotelbedsRouter = require('./routes/hotels/hotelbeds')
const ticketsPkfareRouter = require('./routes/tickets/pkfare')
const settingsRouter = require('./routes/settings')
const airportsRouter = require('./routes/airports')
const citiesRouter = require('./routes/cities')
const regionsRouter = require('./routes/regions')
const cardsRouter = require('./routes/cards')
const checkoutRouter = require('./routes/checkout')
const ordersRouter = require('./routes/orders')
const reportsRouter = require('./routes/reports')
const { sabreToken } = require('./middleware/sabre')
const {
  authenticateTasAdmin,
  authenticateAdmin
} = require('./middleware/authenticate')

const jwtAuthenticate = passport.authenticate('jwt', { session: false })

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

// limit cors for 1 origin (client app uri)
app.use(
  cors({
    origin: process.env.ALLOW_ORIGIN
  })
)

app.use(passport.initialize())
require('./config/passport')

app.use('/auth', authRouter)
app.use('/requests', requestsRouter)
app.use('/users', jwtAuthenticate, usersRouter)
app.use('/trips', jwtAuthenticate, tripsRouter)
app.use('/expenses', jwtAuthenticate, expensesRouter)
app.use('/orders', jwtAuthenticate, ordersRouter)
app.use('/reports', jwtAuthenticate, reportsRouter)

// tas-admin routes
app.use(
  '/tas-admin/requests',
  jwtAuthenticate,
  authenticateTasAdmin,
  tasAdminRequestsRouter
)
app.use(
  '/tas-admin/users',
  jwtAuthenticate,
  authenticateTasAdmin,
  tasAdminUsersRouter
)
app.use(
  '/tas-admin/companies',
  jwtAuthenticate,
  authenticateTasAdmin,
  tasAdminCompaniesRouter
)

app.use(
  '/tas-admin/orders',
  jwtAuthenticate,
  authenticateTasAdmin,
  tasAdminOrdersRouter
)

// admin routes
app.use(
  '/admin/company',
  jwtAuthenticate,
  authenticateAdmin,
  adminCompanyRouter
)
app.use('/admin/users', jwtAuthenticate, authenticateAdmin, adminUsersRouter)
app.use('/admin/roles', jwtAuthenticate, authenticateAdmin, adminRolesRouter)
app.use('/admin/trips', jwtAuthenticate, authenticateAdmin, adminTripsRouter)
app.use(
  '/admin/expenses',
  jwtAuthenticate,
  authenticateAdmin,
  adminExpensesRouter
)
app.use(
  '/admin/policies',
  jwtAuthenticate,
  authenticateAdmin,
  adminPolicyRouter
)
app.use(
  '/admin/departments',
  jwtAuthenticate,
  authenticateAdmin,
  adminDepartmentRouter
)

app.use(
  '/admin/reports',
  jwtAuthenticate,
  authenticateAdmin,
  adminReportsRouter
)

// flights
app.use('/flights/pkfare', jwtAuthenticate, flightsPkfareRouter)
app.use('/flights/sabre', jwtAuthenticate, flightsSabreRouter)

// hotels
app.use('/hotels/pkfare', jwtAuthenticate, hotelsPkfareRouter)
app.use('/hotels/hotelbeds', jwtAuthenticate, hotelbedsRouter)

// tickets
app.use('/tickets/pkfare', ticketsPkfareRouter)

// content api
app.use('/settings', jwtAuthenticate, settingsRouter)
app.use('/airports', jwtAuthenticate, airportsRouter)
app.use('/cities', jwtAuthenticate, citiesRouter)
app.use('/regions', jwtAuthenticate, regionsRouter)

// checkout
app.use('/cards', jwtAuthenticate, cardsRouter)

app.use('/checkout', jwtAuthenticate, sabreToken, checkoutRouter)

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
