import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api, { analystAPI } from '../api';
import { User, Mail, Shield, Lock, Loader, CheckCircle, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const location = useLocation();
    const [linkedAnalyst, setLinkedAnalyst] = useState(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.analyst_id) {
            fetchLinkedAnalyst();
        }

        // Check if redirected here for forced password change
        if (location.state?.forcePasswordChange) {
            setForcePasswordChange(true);
            setShowPasswordForm(true);
        }
    }, [user, location]);

    const fetchLinkedAnalyst = async () => {
        try {
            const response = await analystAPI.getById(user.analyst_id);
            setLinkedAnalyst(response.data);
        } catch (err) {
            console.error('Error fetching linked analyst:', err);
        }
    };

    const getRoleLabel = (role) => {
        const roleMap = {
            'admin': 'Administrator',
            'soc_manager': 'SOC Manager',
            'shift_coordinator': 'Shift Coordinator',
            'l1_analyst': 'Level 1 Analyst',
            'l2_analyst': 'Level 2 Analyst',
            'hr_payroll': 'HR/Payroll'
        };
        return roleMap[role] || role;
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'New password must be at least 8 characters';
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setSuccess('');
        setErrors({});

        if (!validatePasswordForm()) {
            return;
        }

        try {
            setLoading(true);
            await api.put('/auth/change-password', {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword
            });

            setSuccess('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // If this was a forced password change, redirect to home after success
            if (forcePasswordChange) {
                setTimeout(() => {
                    setForcePasswordChange(false);
                    window.location.href = '/';  // Full reload to clear the flag
                }, 2000);
            } else {
                setShowPasswordForm(false);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Password change error:', err);
            const errorMsg = err.response?.data?.error || 'Failed to change password';
            setErrors({ submit: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-600 mb-8">View your account information and manage your password</p>

            {/* Force Password Change Warning */}
            {forcePasswordChange && (
                <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-4 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-lg mb-1">Password Change Required</h3>
                            <p className="mb-2">
                                Your password has been reset by an administrator. You must change it before you can access the system.
                            </p>
                            <p className="text-sm text-red-700">
                                Please enter your current (temporary) password and choose a new secure password below.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            {/* Profile Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User size={24} className="text-indigo-600" />
                    Account Information
                </h2>

                <div className="space-y-4">
                    {/* Username */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <User size={20} className="text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Username</p>
                            <p className="font-semibold">{user?.username}</p>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <Mail size={20} className="text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold">{user?.email}</p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <Shield size={20} className="text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-semibold">{getRoleLabel(user?.role)}</p>
                        </div>
                    </div>

                    {/* Linked Analyst */}
                    {user?.analyst_id && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <LinkIcon size={20} className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Linked Analyst</p>
                                {linkedAnalyst ? (
                                    <p className="font-semibold">
                                        {linkedAnalyst.first_name} {linkedAnalyst.last_name} (ID: {linkedAnalyst.employee_id})
                                    </p>
                                ) : (
                                    <p className="font-semibold">Loading...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-5 flex justify-center">
                            <div className={`w-3 h-3 rounded-full ${user?.status === 'active' ? 'bg-green-500' :
                                user?.status === 'pending_approval' ? 'bg-yellow-500' :
                                    'bg-gray-500'
                                }`}></div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Account Status</p>
                            <p className="font-semibold capitalize">{user?.status?.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Lock size={24} className="text-indigo-600" />
                    Password & Security
                </h2>

                {!showPasswordForm ? (
                    <div>
                        <p className="text-gray-600 mb-4">
                            Keep your account secure by using a strong password and changing it regularly.
                        </p>
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                        >
                            Change Password
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Current Password *
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading}
                            />
                            {errors.currentPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password *
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Minimum 8 characters"
                                disabled={loading}
                            />
                            {errors.newPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm New Password *
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Re-enter new password"
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {errors.submit}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && <Loader className="animate-spin" size={16} />}
                                Save New Password
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                    setErrors({});
                                }}
                                disabled={loading}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
