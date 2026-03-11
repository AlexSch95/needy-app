import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FivemTokenProvider } from './context/FivemTokenContext'
import Login from './pages/Login'
import Register from './pages/Register'
import CompleteProfile from './pages/CompleteProfile'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function ProtectedRoute({ children, requireComplete = true }) {
    const { user, isProfileComplete, loading } = useAuth()

    if (loading) {
        return <div className="loading-screen">Laden...</div>
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    if (requireComplete && !isProfileComplete) {
        return <Navigate to="/complete-profile" />
    }

    return children
}

function AuthRoute({ children }) {
    const { user, isProfileComplete, loading } = useAuth()

    if (loading) {
        return <div className="loading-screen">Laden...</div>
    }

    if (user) {
        if (isProfileComplete) {
            return <Navigate to="/discover" />
        }
        return <Navigate to="/complete-profile" />
    }

    return children
}

function App() {
    return (
        <BrowserRouter>
            <FivemTokenProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={
                            <AuthRoute>
                                <Login />
                            </AuthRoute>
                        } />
                        <Route path="/register" element={
                            <AuthRoute>
                                <Register />
                            </AuthRoute>
                        } />
                        <Route path="/complete-profile" element={
                            <ProtectedRoute requireComplete={false}>
                                <CompleteProfile />
                            </ProtectedRoute>
                        } />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="/discover" />} />
                            <Route path="discover" element={<Discover />} />
                            <Route path="matches" element={<Matches />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="admin" element={<Admin />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AuthProvider>
            </FivemTokenProvider>
        </BrowserRouter>
    )
}

export default App
