const fs = require('fs')

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
)

exports.getAllUsers = (req, res) => {
  res.json({
    status: 'success',
    data: {
      users
    }
  })
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'server error'
  })
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'server error'
  })
};
