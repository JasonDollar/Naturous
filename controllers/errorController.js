const AppError = require('../utils/appError')

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err, res) => {
  // operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  // programming or other unknown error: don't leak error detail
  } else {
    console.error('ERROR', err)

    // generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    })
  }
}

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
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = {...err}
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    if (err.code === 11000) error = handleDuplicateFieldsDB(error)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error)
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

    sendErrorProd(error, res)
  }
  next()
}