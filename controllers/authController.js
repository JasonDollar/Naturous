const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
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