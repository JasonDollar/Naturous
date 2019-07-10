const { Schema, model } = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./User')

const tourSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a name'],
    unique: true,
    maxlength: [60, 'A tour name must have less or equal than 60 characters'],
    minlength: [6, 'A tour name must have more or equal than 6 characters'],
    // validate: [validator.isAlpha, 'Tour name must only contain letters'],
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have duration'],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    max: [5, 'Max rating is a 5'],
    min: [1, 'Min rating is a 1'],
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator(val) {
        return val < this.price
      },
      message: 'Discount price of ({VALUE}) should not be below regular price',
    },
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is eiter ease, medium, difficult',
    },
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },

  summary: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false,
  },
  startLocation: {
    // geoJSON - for geospatial data (type and coordinates are minimum)
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
  ],
  guides: Array,
}, {
  toJSON: { virtuals: true }, // when data is outputted it should use virtual fields
  toObject: { virtuals: true },
})

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7 // this points to current document
})

//save and createImageBitmap, not insertmany
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true})
  next()
})

tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id))
  this.guides = await Promise.all(guidesPromises)
  next()
})

// tourSchema.post('save', function(doc, next) {
//   console.log(doc)
//   next()
// })

//query middleware
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  // this === find query
  this.find({secretTour: {$ne: true}})
  this.start = Date.now()
  next()
})

tourSchema.post(/^find/, function(docs, next) {
  // console.log(docs)
  console.log(Date.now() - this.start)
  next()
})

//aggregation
tourSchema.pre('aggregate', function(next) {
  //unshift bc it is an array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  next()
})

const Tour = model('Tour', tourSchema)

module.exports = Tour