const AppError = require('../utils/appError')

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const sendErrorDev = (err,req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  } 

  // RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  })
  
}

const sendErrorProd = (err, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // operational, trusted error: send message to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    // programming or other unknown error: don't leak error detail
    } 
    console.error('ERROR', err)

    // generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    })
    
    /*eslint-disable */
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    // programming or other unknown error: don't leak error detail
    } 
      console.error('ERROR', err)

    // RENDERED WEBSITE
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    })
    

  } 
}
/* eslint-enable */

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  console.log(value)
  const message = `Duplicate field value: ${value}. Please use another value`
  return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(item => item.message)
  const message = `Invalid input data. ${errors.join('. ')}`

  return new AppError(message, 400)
}

const handleJWTError = err => new AppError('Invalid token. Please log in again', 401)

const handleJWTExpiredError = err => new AppError('Your token has expired. Please log in again', 401)

module.exports = (err, req, res, next) => {

  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err,req, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }
    error.message = err.message
    
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    if (err.code === 11000) error = handleDuplicateFieldsDB(error)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error)
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

    sendErrorProd(error, res)
  }
  next()
}