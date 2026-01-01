const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.get('/guest', authController.guestLogin);

module.exports = router;