const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(item => {
    if (allowedFields.includes(item)) newObj[item] = obj[item]
  })
  return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
  res.json({
    status: 'success',
    data: {
      users,
    },
  })
})

exports.updateMe = catchAsync(async (req, res, next) => {
  //1 create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
  }
  //2 update user doc
  const filteredBody = filterObj(req.body, 'name', 'email')
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, { 
    new: true, runValidators: true, 
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false })

  res.status(204).json({
    status: 'success',
  })
})

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'server error',
  })
}
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'server error',
  })
}
