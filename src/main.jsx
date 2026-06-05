import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ProjectDashboard from './pages/ProjectDashboard';

// New Agile Workflow Pages
import Dashboard from './pages/Dashboard.jsx'
import NewProject from './pages/NewProject.jsx'
import ProjectView from './pages/ProjectView.jsx'

import { AuthProvider } from "./auth/AuthContext.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/Login.jsx'
import SignupPage from './pages/Signup.jsx'
import GuestRoute from './auth/GuestRoute.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Demo from './pages/Demo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          {/* Guest only — logged in users get pushed to /dashboard */}
          <Route path="/" element={<GuestRoute><App /></GuestRoute>} />
          <Route path="/signin" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/demo" element={<GuestRoute><Demo /></GuestRoute>} />

          {/* Protected BA Workflows — logged out users get pushed to /signin */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/project/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/project/:projectId" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
          <Route path="/project/:projectId/dashboard" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>
)