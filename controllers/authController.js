const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const signToken = id =>  jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
})

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body)

  const token = signToken(newUser._id)

  delete newUser.password
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  })
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }
  const user = await User.findOne({ email }).select('+password')
  // +password - if we want to select field which is set to not be selectable  in schema
  const isMatch = user ? await user.correctPassword(password, user.password) : false
  if (!user || !isMatch) {
    return next(new AppError('Incorrect email or password', 401))
  }

  const token = signToken(user._id)

  res.status(200).json({
    status: 'success',
    token,
  })
})

exports.protect = catchAsync(async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to gain access', 401))
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  const freshUser = await User.findById(decoded.id)
  if (!freshUser) {
    return next(new AppError('The user belonging to this token no longer exists', 401))
  }
  const isPasswordChangedRecently = freshUser.changedPasswordAfter(token.iat)
  if (isPasswordChangedRecently) {
    return next(new AppError('User recently changed password. Please log in again!', 401))
  }
  
  // grant access to protected routes
  req.user = freshUser
  next()
})