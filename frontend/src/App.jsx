import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Flow from './pages/Flow'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Routes>
      {/* Root → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* App */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/flow" element={<Flow />} />
      <Route path="/profile" element={<Profile />} />

      {/* Legacy home */}
      <Route path="/home" element={<Home />} />
    </Routes>
  )
}

export default App
