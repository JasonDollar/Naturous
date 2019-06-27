const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({path: './config.env'})
const app = require('./app')

mongoose.connect(process.env.MONGO_URI_DEV, { useNewUrlParser: true })
  .then(() => console.log('db connected'))
  .catch(e => console.log(e))

  

app.listen(process.env.PORT || 3000, () => {
  console.log('server stared')
})
