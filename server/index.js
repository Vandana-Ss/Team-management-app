const express = require('express')
const path = require('path')
require('dotenv').config()
const session = require('express-session')
const passport = require('passport')
const authRoutes = require('./src/routes/authRoutes')
const workspaceRoutes = require('./src/routes/workspaceRoutes')
const taskRoutes = require('./src/routes/taskRoutes')
const commentRoutes = require('./src/routes/commentRoutes')
const archiveRoutes = require('./src/routes/archivedRoutes')
require('./src/config/passport')
const connectDB = require('./src/config/db')
const cors = require('cors');


const app = express()

app.set('json spaces', 2)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const isProduction = process.env.NODE_ENV === 'production'

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction, // true in production...requires HTTPS
        sameSite: isProduction ? 'none' : 'lax', // allows cross site cookies in prod
        maxAge: 24 * 60 * 60 * 1000 
    }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/auth', authRoutes)

app.use('/api/workspaces', workspaceRoutes)

app.use('/api/tasks', taskRoutes)

app.use('/api/comments', commentRoutes)

app.use('/api/archives', archiveRoutes)

const PORT = process.env.PORT || 5000

const startServer = async () => {
    try{
        await connectDB()

        app.listen(PORT, () => {
            console.log(`Server successfully initialized and listening on port ${PORT}`)
        }) 
    }
    catch (err){
        console.error("Failed to connect to DB. Server not started", err)
        process.exit(1)
    }
}

startServer()