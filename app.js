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
const budgetRouter = require('./routes/budgets')
const usersRouter = require('./routes/users')
const tripsRouter = require('./routes/trips')
const tasAdminUsersRouter = require('./routes/tas-admin/users')
const tasAdminCompaniesRouter = require('./routes/tas-admin/companies')
const tasAdminRequestsRouter = require('./routes/tas-admin/requests')
const adminCompanyRouter = require('./routes/admin/company')
const adminUsersRouter = require('./routes/admin/users')

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
  '/budgets',
  passport.authenticate('jwt', { session: false }),
  budgetRouter
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
