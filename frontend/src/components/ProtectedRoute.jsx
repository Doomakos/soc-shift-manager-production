import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirements if specified
    if (roles && roles.length > 0) {
        if (!user || !roles.includes(user.role)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
                        <p className="text-xl text-gray-700 mb-2">Access Denied</p>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access this page.
                        </p>
                        <p className="text-sm text-gray-500">
                            Required role: {roles.join(', ')}
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    // User is authenticated and has required role
    return children;
};

export default ProtectedRoute;
