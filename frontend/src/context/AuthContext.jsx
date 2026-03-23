import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser && storedAccessToken) {
            setUser(JSON.parse(storedUser));
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password,
            });

            const { access_token, refresh_token, user: userData, force_password_change } = response.data;

            // Store in state
            setUser(userData);
            setAccessToken(access_token);
            setRefreshToken(refresh_token);
            setIsAuthenticated(true);

            // Persist to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('refreshToken', refresh_token);

            return { success: true, user: userData, force_password_change };
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        // Clear state
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);

        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const refreshAccessToken = async () => {
        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/refresh',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                    },
                }
            );

            const { access_token } = response.data;
            setAccessToken(access_token);
            localStorage.setItem('accessToken', access_token);

            return access_token;
        } catch (error) {
            // Refresh failed, logout user
            logout();
            return null;
        }
    };

    const hasRole = (...roles) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    const value = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshAccessToken,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
