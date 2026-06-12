const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const bcrypt = require('bcrypt')
const path = require('path')
const fs = require('fs')
const Workspace = require('../models/workspaceModel')
const Member = require('../models/memberModel')
const Task = require('../models/taskModel')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '5d',
    })
}

const registerUser = async (req, res) => {
    const { name, email, password } = req.body

    try {
        const userExists = await User.findOne({ email })

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const user = await User.create({ name, email, password })

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const loginUser = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                message: info ? info.message : 'Login failed',
                user: user
            })
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        })
    })(req, res, next)
}

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password')
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getMe = async (req, res) => {
    try {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            emailNotifications: req.user.emailNotifications ?? true,
            profilePicture: req.user.profilePicture || null
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name cannot be empty' })
        }

        if (name.trim().length > 50) {
            return res.status(400).json({ message: 'Name cannot exceed 50 characters' })
        }

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select('-password')

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            emailNotifications: updated.emailNotifications
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' })
        }

        const user = await User.findById(req.user._id)
        const match = await bcrypt.compare(currentPassword, user.password)

        if (!match) {
            return res.status(400).json({ message: 'Current password is incorrect' })
        }

        user.password = newPassword
        await user.save()

        res.json({ message: 'Password updated successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateNotifications = async (req, res) => {
    try {
        const { emailNotifications } = req.body

        if (typeof emailNotifications !== 'boolean') {
            return res.status(400).json({ message: 'emailNotifications must be a boolean' })
        }

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { emailNotifications },
            { new: true }
        ).select('-password')

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            emailNotifications: updated.emailNotifications
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteAccount = async (req, res) => {
    try {
        const { email } = req.body

        if (!email || email !== req.user.email) {
            return res.status(400).json({ message: 'Email does not match your account' })
        }

        const ownedWorkspaces = await Workspace.find({ owner: req.user._id })

        for (const ws of ownedWorkspaces) {
            await Task.deleteMany({ workspace: ws._id })
            await Member.deleteMany({ workspace: ws._id })
            await Workspace.findByIdAndDelete(ws._id)
        }

        await Member.deleteMany({ user: req.user._id })
        await User.findByIdAndDelete(req.user._id)

        res.json({ message: 'Account deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const user = await User.findById(req.user._id)

        if (user.profilePicture) {
            const oldFilePath = path.join(__dirname, '../../../uploads/avatars', path.basename(user.profilePicture))
            try {
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath)
            } catch (_) {}
        }

        const profilePicture = `/uploads/avatars/${req.file.filename}`
        await User.findByIdAndUpdate(req.user._id, { profilePicture }, { new: true })

        res.json({ profilePicture })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const removeProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (user.profilePicture) {
            const oldFilePath = path.join(__dirname, '../../../uploads/avatars', path.basename(user.profilePicture))
            try {
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath)
            } catch (_) {}
        }

        await User.findByIdAndUpdate(req.user._id, { profilePicture: null })

        res.json({ message: 'Profile picture removed' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
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
}
