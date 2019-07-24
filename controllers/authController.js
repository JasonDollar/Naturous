const { promisify } = require('util')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')

const signToken = id =>  jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
})

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  user.password = undefined

  res.cookie('jwt', token, cookieOptions)

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  })

  createAndSendToken(newUser, 201, res)
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
  createAndSendToken(user, 200, res)
})

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  res.status(200).json({ status: 'success' })
}


exports.protect = catchAsync(async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
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
  res.locals.user = freshUser
  req.user = freshUser
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role)) {
      return next(new AppError('You don\'t have required permission to perform this action', 403))
    }
    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('There is no user with that email address', 404))
  }
  const resetToken = user.createPasswordResetToken()
  // set to false bc we don't save here fields which are otherwise required (f.e: password, which is not even queried from db)
  await user.save({ validateBeforeSave: false })

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \n If you didn't forget your password, please ignore this email`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset link (valid for 10min)',
      message,
    })
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    })
  } catch(e) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError('There was an error sending an email. Please try again later', 500))
  }
  // next()
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({ passwordResetToken : hashedToken, passwordResetExpires: { $gte: Date.now() - (2 * 60 * 60 * 1000) }})
  // if token has not expiredand there is a user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400))
  // update changedAt property for current user
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  // using user.save() runs db validators - it will check if password and password confirm is the same
  await user.save()
  // log user in
  createAndSendToken(user, 200, res)

})

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get user from collection
  const user = await User.findOne({ email: req.user.email }).select('+password')
  //2 check if posted password is correct
  const isPasswordCorrect = await user.correctPassword(req.body.currentPassword, user.password)
  //3 if so, update the password
  if (!isPasswordCorrect) {
    return next(new AppError('Your password is incorrect', 401))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()
  //4 log user in
  createAndSendToken(user, 200, res)
})

// no errors, only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      )

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id)
      if (!currentUser) {
        return next()
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
      }

      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

