import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import WorkspacesList from './pages/WorkspacesList'
import Task from './pages/Task'
import JoinPage from './pages/JoinPage'
import ArchiveBinView from './pages/ArchiveBinView'
import Settings from './pages/Settings'

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <Routes>
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <Register />} />
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />

      <Route path="/join/:inviteCode" element={<JoinPage />} />

      <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/" />}>
        <Route path="/home" element={<Home />} />
        <Route path="/workspace/:workspaceId" element={<Workspace />} />
        <Route path="/workspaces" element={<WorkspacesList />} />
        <Route path="/workspace/:workspaceId/task/:taskId" element={<Task />} />
        <Route path="/archive-bin" element={<ArchiveBinView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App