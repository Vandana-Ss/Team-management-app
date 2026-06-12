const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { protect } = require('../middleware/authMiddleware')
const {
    registerUser,
    loginUser,
    getUsers,
    getMe,
    updateProfile,
    updatePassword,
    updateNotifications,
    deleteAccount,
    uploadProfilePicture,
    removeProfilePicture
} = require('../controllers/authController')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/avatars')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (allowed.includes(file.mimetype)) cb(null, true)
        else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'))
    }
})

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/users', getUsers)

router.get('/me', protect, getMe)
router.patch('/profile', protect, updateProfile)
router.patch('/password', protect, updatePassword)
router.patch('/notifications', protect, updateNotifications)
router.delete('/account', protect, deleteAccount)
router.patch('/profile-picture', protect, upload.single('avatar'), uploadProfilePicture)
router.delete('/profile-picture', protect, removeProfilePicture)

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
