const express = require('express');
const authController = require('../controller/authController');
const AuthCheck = require('../middleware/authCheck');

const router = express.Router();


router.post('/register',authController.Register)
router.post('/verify-email',authController.VerifyEmail)
router.post('/login',authController.Login)
//router.get('/dashboard',AuthCheck,authController.Dashboard)


module.exports = router;