import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
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
import axios from 'axios';
import {
    BarChart3,
    CalendarDays,
    Clock3,
    Home as HomeIcon,
    LayoutDashboard,
    Menu,
    Settings,
    Shield,
    User,
    UserCog,
    Users,
    X,
} from 'lucide-react';

const AUTH_API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Navigation component with role-aware UI
function Navigation() {
    const { isAuthenticated, user, logout, hasRole } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Define role-based visibility
    const canManage = hasRole('admin', 'soc_manager', 'shift_coordinator');
    const canViewPayRules = hasRole('admin', 'soc_manager');
    const canViewAdvanced = hasRole('admin', 'soc_manager', 'shift_coordinator');

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const navItems = [
        { to: '/', label: 'Home', icon: HomeIcon, show: true },
        { to: '/analysts', label: 'Analysts', icon: Users, show: canManage },
        { to: '/shifts', label: 'Shifts', icon: LayoutDashboard, show: canManage },
        { to: '/calendar-standard', label: 'Calendar', icon: CalendarDays, show: true },
        { to: '/calendar-advanced', label: 'Advanced', icon: Settings, show: canViewAdvanced },
        { to: '/analytics', label: 'Analytics', icon: BarChart3, show: true },
        { to: '/pay-rules', label: 'Pay Rules', icon: Shield, show: canViewPayRules },
        { to: '/standby', label: 'L2 Standby', icon: Clock3, show: canManage },
        { to: '/users', label: 'Users', icon: UserCog, show: canViewPayRules },
    ].filter((item) => item.show);

    const getNavClass = ({ isActive }) => (
        isActive
            ? 'text-white bg-white/20 rounded-md px-3 py-2 transition-colors'
            : 'text-blue-50 hover:text-white hover:bg-white/10 rounded-md px-3 py-2 transition-colors'
    );

    return (
        <nav className="sticky top-0 z-30 bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 text-white shadow-lg">
            <div className="container mx-auto px-4 py-3 lg:px-6 lg:py-4">
                <div className="flex items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-wide lg:text-xl">
                        <span className="rounded-md bg-white/15 p-2">
                            <Shield size={18} />
                        </span>
                        <span>SOC Shift Manager</span>
                    </Link>

                    {isAuthenticated && (
                        <button
                            type="button"
                            className="rounded-md p-2 text-blue-50 hover:bg-white/10 lg:hidden"
                            onClick={() => setMobileOpen((open) => !open)}
                            aria-label="Toggle navigation menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    )}
                </div>

                {isAuthenticated ? (
                    <>
                        <div className="mt-4 hidden items-center justify-between gap-4 lg:flex">
                            <div className="flex flex-wrap items-center gap-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink key={item.to} to={item.to} className={getNavClass}>
                                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                                                <Icon size={15} />
                                                {item.label}
                                            </span>
                                        </NavLink>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-3">
                                <NavLink
                                    to="/profile"
                                    className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-blue-50 hover:bg-white/20"
                                >
                                    <User size={14} />
                                    {user?.username} ({user?.role})
                                </NavLink>
                                <button
                                    onClick={logout}
                                    className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold hover:bg-rose-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {mobileOpen && (
                            <div className="mt-3 space-y-2 rounded-lg border border-white/15 bg-slate-800/80 p-3 backdrop-blur lg:hidden">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink key={item.to} to={item.to} className={getNavClass}>
                                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                                                <Icon size={15} />
                                                {item.label}
                                            </span>
                                        </NavLink>
                                    );
                                })}

                                <NavLink
                                    to="/profile"
                                    className="inline-flex w-full items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-blue-50 hover:bg-white/20"
                                >
                                    <User size={14} />
                                    {user?.username} ({user?.role})
                                </NavLink>

                                <button
                                    onClick={logout}
                                    className="w-full rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold hover:bg-rose-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-3 flex justify-end">
                        <Link
                            to="/login"
                            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
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
                const response = await axios.get(`${AUTH_API_BASE_URL}/auth/setup`);
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
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen">
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
                                <ProtectedRoute roles={['admin', 'soc_manager', 'shift_coordinator']}>
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
