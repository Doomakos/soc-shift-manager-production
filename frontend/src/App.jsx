import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AnalystManagement from './pages/AnalystManagement';
import ShiftManagement from './pages/ShiftManagement';
import ShiftCalendarStandard from './pages/ShiftCalendarStandard';
import ShiftCalendarAdvanced from './pages/ShiftCalendarAdvanced';
import Analytics from './pages/Analytics';
import PayRulesManagement from './pages/PayRulesManagement';
import StandbyManagement from './pages/StandbyManagement';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import { systemAPI } from './api';
import axios from 'axios';

// Navigation component with role-aware UI
function Navigation() {
    const { isAuthenticated, user, logout, hasRole } = useAuth();

    // Define role-based visibility
    const canManage = hasRole('admin', 'soc_manager', 'shift_coordinator');
    const canViewAnalytics = hasRole('admin', 'soc_manager', 'shift_coordinator', 'hr_payroll');
    const canViewPayRules = hasRole('admin', 'soc_manager');
    const canViewAdvanced = hasRole('admin', 'soc_manager', 'shift_coordinator');

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold">
                    🔐 SOC Shift Manager
                </Link>

                {isAuthenticated ? (
                    <>
                        <div className="flex gap-6">
                            <Link to="/" className="hover:text-blue-100 transition-colors">
                                Home
                            </Link>

                            {/* Analysts & Shifts - Management roles only */}
                            {canManage && (
                                <>
                                    <Link to="/analysts" className="hover:text-blue-100 transition-colors">
                                        Analysts
                                    </Link>
                                    <Link to="/shifts" className="hover:text-blue-100 transition-colors">
                                        Shifts
                                    </Link>
                                </>
                            )}

                            {/* Standard Calendar - All authenticated users */}
                            <Link to="/calendar-standard" className="hover:text-blue-100 transition-colors">
                                📅 Calendar
                            </Link>

                            {/* Advanced Calendar - Management roles only */}
                            {canViewAdvanced && (
                                <Link to="/calendar-advanced" className="hover:text-blue-100 transition-colors">
                                    ⚡ Advanced
                                </Link>
                            )}

                            {/* Analytics - All authenticated users (own data for analysts) */}
                            <Link to="/analytics" className="hover:text-blue-100 transition-colors">
                                Analytics
                            </Link>

                            {/* Pay Rules - Admin + SOC Manager only */}
                            {canViewPayRules && (
                                <Link to="/pay-rules" className="hover:text-blue-100 transition-colors">
                                    Pay Rules
                                </Link>
                            )}

                            {/* Standby - Management roles only */}
                            {canManage && (
                                <Link to="/standby" className="hover:text-blue-100 transition-colors">
                                    🚨 L2 Standby
                                </Link>
                            )}

                            {/* User Management - Admin and SOC Manager only */}
                            {canViewPayRules && (
                                <Link to="/users" className="hover:text-blue-100 transition-colors">
                                    👥 Users
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/profile" className="text-sm hover:text-blue-100 transition-colors">
                                👤 {user?.username} ({user?.role})
                            </Link>
                            <button
                                onClick={logout}
                                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex gap-4">
                        <Link
                            to="/login"
                            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            Login
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

// First-run check component
function FirstRunCheck({ children }) {
    const [needsSetup, setNeedsSetup] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkSetup = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/auth/setup');
                setNeedsSetup(response.data.needs_setup);
            } catch (error) {
                console.error('Setup check failed:', error);
                setNeedsSetup(false);
            } finally {
                setChecking(false);
            }
        };

        checkSetup();
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing...</p>
                </div>
            </div>
        );
    }

    if (needsSetup) {
        return <Navigate to="/setup" replace />;
    }

    return children;
}

function App() {
    useEffect(() => {
        // Initialize database on app load
        systemAPI.init().catch((err) => console.error('Init failed:', err));
    }, []);

    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-100">
                    <Navigation />

                    <Routes>
                        {/* Public routes */}
                        <Route path="/setup" element={<Setup />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected routes - all require authentication */}
                        <Route
                            path="/"
                            element={
                                <FirstRunCheck>
                                    <ProtectedRoute>
                                        <Home />
                                    </ProtectedRoute>
                                </FirstRunCheck>
                            }
                        />
                        <Route
                            path="/analysts"
                            element={
                                <ProtectedRoute roles={['admin', 'soc_manager', 'shift_coordinator']}>
                                    <AnalystManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/shifts"
                            element={
                                <ProtectedRoute roles={['admin', 'soc_manager', 'shift_coordinator']}>
                                    <ShiftManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar-standard"
                            element={
                                <ProtectedRoute>
                                    <ShiftCalendarStandard readOnly={false} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar-advanced"
                            element={
                                <ProtectedRoute>
                                    <ShiftCalendarAdvanced readOnly={false} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute>
                                    <Analytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/pay-rules"
                            element={
                                <ProtectedRoute roles={['admin', 'soc_manager']}>
                                    <PayRulesManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/standby"
                            element={
                                <ProtectedRoute roles={['admin', 'soc_manager', 'shift_coordinator']}>
                                    <StandbyManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute roles={['admin', 'soc_manager']}>
                                    <UserManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
