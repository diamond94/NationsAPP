const mongoose = require('mongoose');
//const validator = require('validator');
//const slugify = require('slugify');

const numberWithCommas = require('../utils/numberWithCommas.js');

const coutrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `You should define Country name!💥`],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [7, `Country name must be >= 7 charcters`],
      //validate: [validator.isAlpha, `Country name should only contain charcters!!`],
      //maxlength: [40, `A Country name must be <= than 40 chars `],
      //minlength: [5, `A Country name must be >= than 5 chars `],
    },
    //slug: String,
    capital: {
      type: String,
      required: [true, `You should define Captial Name!💥`],
      unique: true,
      uppercase: true,
      trim: true,
    },
    GDP_Trillion: {
      type: Number,
      required: [true, `You should define GDB value for Country`],
    },
    timeZone: {
      type: String,
      required: [true, `You should define Time_Zone value for Country`],
    },
    continent: {
      type: String,
      required: [true, `You should define continent of Country`],
      enum: {
        values: ['Asia', 'North_America', 'South_America', 'Africa', 'Europe', 'Oceania'],
        message: `The Enterd continet name must be : Asia || North_America || South_America || Africa || Europe || Oceania`,
      },
    },
    Life_expectancy_at_birth: {
      type: Number,
    },
    CO2_emissions: {
      type: Number,
    },
    population_Billion: {
      type: Number,
      required: [true, `You should define Population value for Country`],
    },
    scholl_enrollment: {
      type: Number,
    },
    Avg_Monthly_Temp: {
      type: Object,
    },
    Avg_Monthly_Rainfall: {
      type: Object,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    secretCountry: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual Properties
coutrySchema.virtual('population').get(function () {
  return numberWithCommas(this.population_Billion * 1000000);
});

// Document Middleware : runs befor the .save() & .create() command and not on  .insertMany()

// coutrySchema.pre('save', function (next) {
//   this.slug = slugify(this.timeZone, { lower: true });
//   next();
// });

// coutrySchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware :
coutrySchema.pre(/^find/, function (next) {
  this.find({ secretCountry: { $ne: true } });
  // this.start = Date.now();
  next();
});

coutrySchema.post(/^find/, function (doc, next) {
  // console.log(`query tooks ${Date.now() - this.start} milisecond`);
  next();
});

//Agreggation Middleware
coutrySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretCountry: { $ne: true } } });
  next();
});

// create new Model through Schema
const Country = mongoose.model('Country', coutrySchema);

module.exports = Country;
