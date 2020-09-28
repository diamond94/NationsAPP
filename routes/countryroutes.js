const express = require('express');
const countrycontroller = require('../controllers/countrycontroller');
const authcontroller = require('../controllers/authController');

const router = express.Router();

// param middleware
//router.param('id', countrycontroller.checkName);

// alias route
router
  .route('/top5RichCountries')
  .get(countrycontroller.top5RichCountries, countrycontroller.getAllCoutries);

// aggregation routes
router.route('/country-stats').get(countrycontroller.getCountryStat);
router.route('/weather-stats').get(countrycontroller.getWeatherStat);
router.route('/rainFall-stats/:mm?').get(countrycontroller.getRainStat);

// main routes
router
  .route('/')
  .get(authcontroller.protect, countrycontroller.getAllCoutries)
  .post(countrycontroller.createCountry);

router
  .route('/:id')
  .get(authcontroller.protect, countrycontroller.getCountry)
  .patch(countrycontroller.updateCoutry)
  .delete(
    authcontroller.protect,
    authcontroller.restrict('Admin'),
    countrycontroller.deleteCountry
  );

module.exports = router;
