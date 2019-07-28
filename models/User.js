const crypto = require('crypto')
const { Schema, model } = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // works only for save() and create()
      validator(val) {
        return val === this.password
      },
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew ) return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

// query middleware - /^find/ => all queries starting with find
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return jwtTimestamp < changedTimestamp
  }
  // false === not changed
  return false
}

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex')
  // encrypted version of token in DB
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // next 10mins
  console.log({resetToken}, this.passwordResetToken)
  // returned token ready to be send to user by email
  return resetToken
}



const User = model('User', userSchema)

module.exports = User