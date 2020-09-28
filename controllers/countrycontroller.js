const Country = require('../models/countryModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.top5RichCountries = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-GDP_Trillion';
  req.query.fields = '-timeZone,-__v';
  next();
};

exports.top5PoorCountries = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'GDP_Trillion';
  req.query.fields = '-timeZone';
  next();
};

exports.getAllCoutries = catchAsync(async (req, res, next) => {
  //  Execute Query
  const features = new APIFeatures(Country.find(), req.query)
    .filter()
    .sort()
    .selectFields()
    .paginate();
  const Countries = await features.query;
  const count = await Country.countDocuments();
  //  Send Response
  res.status(200).json({
    status: 'success',
    allResultsCount: count,
    thisPage_results: Countries.length,
    data: {
      Countries,
    },
  });
});

exports.getCountry = catchAsync(async (req, res, next) => {
  const country = await Country.findById(req.params.id);

  if (!country) {
    return next(new AppError('NO Country Found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      country,
    },
  });
});

exports.createCountry = catchAsync(async (req, res, next) => {
  const newCountry = await Country.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      country: newCountry,
    },
  });
});

exports.updateCoutry = catchAsync(async (req, res, next) => {
  const country = await Country.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!country) {
    return next(new AppError('NO Country Found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      country,
    },
  });
});

exports.deleteCountry = catchAsync(async (req, res, next) => {
  const country = await Country.findByIdAndDelete(req.params.id);

  if (!country) {
    return next(new AppError('NO Country Found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getCountryStat = catchAsync(async (req, res, next) => {
  const stats = await Country.aggregate([
    {
      $match: { GDP_Trillion: { $gte: 0.001 } },
    },
    {
      $group: {
        _id: { $toUpper: '$continent' },
        numOfCountries: { $sum: 1 },
        avgGdp_Trilion: { $avg: '$GDP_Trillion' },
        minGdp_Trilion: { $min: '$GDP_Trillion' },
        maxGdp_Trilion: { $max: '$GDP_Trillion' },
        countryName: { $push: '$name' },
      },
    },
    {
      $addFields: { continent: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { avgGdp_Trilion: -1 },
    },
    // {
    //   $match: { _id: { $ne: 'ASIA' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getWeatherStat = catchAsync(async (req, res, next) => {
  const stats = await Country.aggregate([
    {
      $project: {
        name: 1,
        Avg_Monthly_Temp: { $objectToArray: '$Avg_Monthly_Temp' },
      },
    },
    {
      $unwind: '$Avg_Monthly_Temp',
    },
    // {
    //   $match: { 'Avg_Monthly_Temp.v': { $lt: 5 } },
    // },
    {
      $group: {
        _id: '$Avg_Monthly_Temp.k',
        maxTemp: { $max: '$Avg_Monthly_Temp.v' },
        minTemp: { $min: '$Avg_Monthly_Temp.v' },
        avgTemp: { $avg: '$Avg_Monthly_Temp.v' },
        name: { $push: '$name' },
      },
    },
    {
      $sort: { minTemp: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getRainStat = catchAsync(async (req, res, next) => {
  const number = req.params.mm * 1;

  const stats = await Country.aggregate([
    {
      $project: {
        name: 1,
        Avg_Monthly_Rainfall: { $objectToArray: '$Avg_Monthly_Rainfall' },
      },
    },
    {
      $unwind: '$Avg_Monthly_Rainfall',
    },
    {
      $match: { 'Avg_Monthly_Rainfall.v': { $gte: number || 0 } },
    },
    {
      $group: {
        _id: '$Avg_Monthly_Rainfall.k',
        maxRainFall: { $max: '$Avg_Monthly_Rainfall.v' },
        minRainFall: { $min: '$Avg_Monthly_Rainfall.v' },
        avgRainFall: { $avg: '$Avg_Monthly_Rainfall.v' },
        name: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $sort: { maxRainFall: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: `rainfall >= ${number || 0}mm`,
    data: {
      stats,
    },
  });
});
