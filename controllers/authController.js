const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    family: req.body.family,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(`Please Provide Email & Password!`, 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect Email or Password`, 401));
  }
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1- check for if we have token in our request or not
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError(`You are not logged in! Please login to get Access`, 401));
  }

  // 2- check if token is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3- check if user stil exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError(`The user belong to this Token in no longer Exists`, 401));
  }

  // 4- check user if changed password
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError(`User recently change Password Please login again`, 401));
  }
  req.user = currentUser;
  next();
});

exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Your are not authorized to perform this! please contact Admin!!`,
          403
        )
      );
    }
    next();
  };
};

exports.forgotpassword = catchAsync(async (req, res, next) => {
  // 1- get user base on email Address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`There is no User with that Email Address`, 404));
  }

  // 2- generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3- send resetToken to userEmail
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `<h3 style="text-align:center;color:green;">Forgot your Password?<h3><div>
                   \n<div style ="text-align: justify"><h5> Submit a patch request with your new password 
                   & Password confirm to link:<a href="${resetURL}">Reset Password</a>\n
                   if you didn't forgot your Password please Ignore this Email`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your Password ResetToken(valid for 10 minutes)`,
      html: message,
    });

    res.status(200).json({
      status: 'success',
      message: `password Reset URL sent to your Email`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(`There was an Error sending the Email! please try Again`, 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(`Token is Invalid or Expired!`, 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    Role: user.role,
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError(`Invalid Password Please Try again!`, 400));
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    role: req.body.role,
    token,
  });
});
