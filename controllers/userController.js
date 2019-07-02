const User = require('../models/User')

exports.getAllUsers = (req, res) => {
  res.json({
    status: 'success',
    data: {
      users: null,
    },
  })
}

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
