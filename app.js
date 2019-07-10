const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express()
if (process.env.NODE_ENV === 'development') {
  // dev logging
  app.use(morgan('dev'))
}

// set security http headers
app.use(helmet())

// limit requests from the same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour', 
})

app.use('/api', limiter)

// body parser, data from body to req.body
app.use(express.json({ limit: '10kb' }))

// data sanitization against noSQL query injection
app.use(mongoSanitize())

// data sanitization against XSS
app.use(xss())

// prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price',
  ],
}))

// serving static files
app.use(express.static(`${__dirname}/public`))

// test middleware
app.use((req, res, next) => {
  req.time = new Date().toISOString()
  next()
})

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant't find ${req.originalUrl} on this server`,
  // })
  const err = new AppError(`Cant't find ${req.originalUrl} on this server`, 404)
  // err.status = 'fail'
  // err.statusCode = 404
  next(err)
})

app.use(globalErrorHandler)

module.exports = app