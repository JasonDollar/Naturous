const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
  res.json({
    status: 'success',
    data: {
      users,
    },
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
