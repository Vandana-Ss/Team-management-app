# SyncNode — Team Management App

A full-stack team collaboration and task management platform built with the MERN stack. Create workspaces, manage tasks through a 4-stage pipeline, collaborate with teammates, and track progress in real time.

---

## Features

- **Authentication** — Email/password login & Google OAuth 2.0
- **Workspaces** — Create workspaces, invite members via unique codes, manage roles (Owner / Admin / Member)
- **Task Management** — 4-stage pipeline: Dev → Unit Test → SIT → UAT, with priority levels and dual assignees
- **Comments & Mentions** — @mention teammates in task comments with email notifications
- **Archive System** — Soft-delete tasks and workspaces with full restore capability
- **Settings** — Profile editing, password change, notification preferences, workspace overview, account deletion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Auth | Passport.js (Local + Google OAuth), JWT |
| Email | Nodemailer |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google OAuth credentials (optional)
- Email account credentials for notifications (optional)

### 1. Clone the repository

```bash
git clone https://github.com/Likash28/Team-management-app.git
cd Team-management-app
```

### 2. Configure environment variables

Create a `.env` file inside the `server/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

EMAIL_SERVICE=yahoo
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_email_password
```

> Google OAuth and email are optional. The app works without them.

### 3. Install dependencies & run

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
Team-management-app/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Login, Register, Home, Workspace, Task, Settings, etc.
│       ├── components/      # Sidebar, Navbar, ProfileDropdown, CommentSection, etc.
│       ├── layouts/         # DashboardLayout
│       └── api/             # Axios instance with JWT interceptor
└── server/                  # Express backend
    └── src/
        ├── models/          # User, Workspace, Members, Task, Comment, Archive, Counter
        ├── controllers/     # Auth, Workspace, Task, Comment, Archive logic
        ├── routes/          # /api/auth, /api/workspaces, /api/tasks, /api/comments, /api/archives
        ├── middleware/       # JWT protect, role-based access (checkRole)
        └── utils/           # Email service (Nodemailer)
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/profile` | Update display name |
| PATCH | `/api/auth/password` | Change password |
| PATCH | `/api/auth/notifications` | Toggle email notifications |
| DELETE | `/api/auth/account` | Delete account permanently |
| GET | `/api/workspaces` | Get all user workspaces |
| POST | `/api/workspaces` | Create a workspace |
| POST | `/api/workspaces/join/:inviteCode` | Request to join workspace |
| DELETE | `/api/workspaces/:id/leave` | Leave a workspace |
| GET | `/api/tasks/:workspaceId` | Get tasks in a workspace |
| POST | `/api/tasks/:workspaceId` | Create a task |
| PATCH | `/api/tasks/:workspaceId/:taskId` | Update a task |
| GET | `/api/comments/:taskId` | Get task comments |
| POST | `/api/comments/:taskId` | Add a comment with @mentions |

---

## Settings

The Settings page (`/settings`) includes:

- **My Profile** — Update display name, view email
- **Security** — Change password with live strength indicator
- **Notifications** — Toggle @mention email alerts
- **My Workspaces** — View all workspaces with role badges, leave non-owned workspaces
- **Danger Zone** — Permanently delete account with email confirmation

---

## Environment Notes

- JWT tokens are stored in `localStorage` and sent as `Bearer` tokens
- Google OAuth redirects to `/login-success?token=<jwt>` after authentication
- Email notifications are sent only when `emailNotifications` is enabled per user
- Task IDs auto-increment starting from `124500`

---

## License

MIT
