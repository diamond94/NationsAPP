const express = require('express');
const morgan = require('morgan');
const jalaliMoment = require('jalali-moment');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const countryRouter = require('./routes/countryroutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MiddleWares
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  const todayJalali = jalaliMoment().locale('fa').format('YYYY/M/D');
  const today = new Date().toLocaleString();
  req.time = today.concat(' & ', todayJalali, ' in Hijri');
  next();
});

// Routers
app.use('/api/v1/countries', countryRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't Find ${req.originalUrl} on this Server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
