const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);
router.route('/forgotpassword').post(authController.forgotpassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router.route('/upateMe').patch(authController.protect, userController.updateMe);
router.route('/deleteMe').delete(authController.protect, userController.deleteMe);

router
  .route('/updateMyPassword')
  .patch(authController.protect, authController.updatePassword);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrict('Admin'),
    userController.getAllUsers
  );

module.exports = router;
