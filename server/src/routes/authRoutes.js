const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { protect } = require('../middleware/authMiddleware')
const {
    registerUser,
    loginUser,
    getUsers,
    getMe,
    updateProfile,
    updatePassword,
    updateNotifications,
    deleteAccount
} = require('../controllers/authController')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/users', getUsers)

router.get('/me', protect, getMe)
router.patch('/profile', protect, updateProfile)
router.patch('/password', protect, updatePassword)
router.patch('/notifications', protect, updateNotifications)
router.delete('/account', protect, deleteAccount)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
        res.redirect(`${clientUrl}/login-success?token=${token}`)
    }
)

module.exports = router
