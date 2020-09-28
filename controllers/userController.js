const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  if (!users) {
    return next(new AppError(`There is no User in DataBase!`, 400));
  }

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `You are not allowed to change your password here! use /updatePassword Route!`,
        400
      )
    );
  }
  const filterObj = (obj, ...role) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
      if (role.includes(el)) {
        newObj[el] = obj[el];
      }
    });
    return newObj;
  };

  const filterBody = filterObj(req.body, 'name', 'family', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: `User Successfuly deleted!`,
  });
});
