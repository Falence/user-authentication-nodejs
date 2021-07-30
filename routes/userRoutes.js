const express = require('express')
const authController = require('./../controllers/authController')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

router.get('/home', authController.protect, authController.restrictTo('user'), (req, res, next) => {
    res.status(200).json({
        status: 'success',
        message: `Welcome ${req.user.name} (${req.user.email})`
    })
})

module.exports = router