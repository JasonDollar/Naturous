const dotenv = require('dotenv')
const mongoose = require('mongoose')

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION! Shutting down gracefully...')
  console.log(err)
  process.exit(1)
})

dotenv.config({path: './config.env'})
const app = require('./app')

mongoose.connect(process.env.MONGO_URI_DEV, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log('db connected'))
  .catch(e => console.log('db error', e))

  

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('server stared')
})

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down gracefully...')
  console.log(err)
  server.close(() => {
    process.exit(1)
  })
})

