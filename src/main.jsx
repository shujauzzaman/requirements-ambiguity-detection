import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Chat from './pages/Chat.jsx'
import { AuthProvider } from "./auth/AuthContext.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/ui/Navbar.jsx'
import LoginPage from './pages/Login.jsx'
import SignupPage from './pages/Signup.jsx'
import GuestRoute from './auth/GuestRoute.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Demo from './pages/Demo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        {/* <Navbar /> */}
        <Routes>
          {/* Guest only — logged in users get pushed to /chat */}
          <Route path="/" element={<GuestRoute><App /></GuestRoute>} />
          <Route path="/signin" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/demo" element={<GuestRoute><Demo /></GuestRoute>} />

          {/* Protected — logged out users get pushed to /login */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>
)
