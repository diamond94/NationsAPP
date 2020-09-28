const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `Please tell us your name :)`],
    trim: true,
  },
  family: {
    type: String,
    required: [true, `Please tell us your name :)`],
    trim: true,
  },
  email: {
    type: String,
    required: [true, `Please provide your Email :)`],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, `Please Type validate Email`],
  },
  photo: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  role: {
    type: String,
    default: 'User',
  },
  password: {
    type: String,
    required: [true, `Please provide a Password`],
    trim: true,
    minlength: [8, `User password must be at least 8 characters`],
    select: false, //this will never show in anyoutput
  },
  passwordConfirm: {
    type: String,
    required: [true, `Please confirm your Password`],
    trim: true,
    validate: {
      // this only work on save & create
      validator: function (value) {
        return value === this.password;
      },
      message: `passwords should be the same`,
    },
  },
  passwordResetToken: String,
  passwordResetExpire: Date,
  passwordChangedAt: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return jwtTimeStamp < changeTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpire = Date.now() + 10 * 1000 * 60;
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
