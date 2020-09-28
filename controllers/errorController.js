const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

const handleDulicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"(.*?)"/)[0].replace(/['"]+/g, ''); // first match string between "" then replace string with "" witn nothing
  const message = `Duplicate Field Value : ${value} Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data:${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    errName: err.name,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational , Trusted Error : send message to clinet
  if (err.isOperationl) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error
  } else {
    // 1- Log the errro
    // eslint-disable-next-line no-console
    console.error('ERROR💥', err);
    // 2- send generic message
    res.status(500).json({
      status: 'error',
      message: `something went very wrong!!💥💥`,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDulicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    sendErrorProd(error, res);
  }
};
