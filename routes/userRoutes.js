const express = require('express')
const authController = require('./../controllers/authController')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.get('/home', authController.protect, (req, res, next) => {
    res.status(200).json({
        status: 'success',
        // message: `Welcome `
        message: `Welcome ${req.user.name} (${req.user.email})`
    })
})

module.exports = router