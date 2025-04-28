const express = require("express");
const authController = require('../controllers/authController');
const { identifier } = require("../middlewares/identification");
const router = express.Router();

router.get('/register', (req, res) => {
    res.render("register"); 
});

router.get('/login', (req, res) => {
    res.render("login"); 
});

router.post('/register', authController.signup);
router.post('/login', authController.signin);
router.post('/signout', identifier, authController.signout);

router.patch('/send-verification-code',identifier, authController.sendVerificationCode);
router.patch('/verify-verification-code',identifier, authController.verifyVerificationCode);
router.patch('/change-password',identifier, authController.changePassword);

router.patch('/send-forgot-password-code', authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', authController.verifyForgotPasswordCode);
module.exports = router;