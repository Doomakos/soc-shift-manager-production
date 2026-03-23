import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Layout, BarChart3, Settings, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { hasRole } = useAuth();

    const canManage = hasRole('admin', 'soc_manager', 'shift_coordinator');
    const canViewPayRules = hasRole('admin', 'soc_manager');
    const isAnalyst = hasRole('l1_analyst', 'l2_analyst');

    // All available features with role requirements
    const allFeatures = [
        {
            icon: Users,
            title: 'Analyst Management',
            description: 'Register and manage Level 1 SOC analysts',
            link: '/analysts',
            color: 'bg-blue-500',
            show: canManage,
        },
        {
            icon: Calendar,
            title: isAnalyst ? 'My Shifts' : 'Shift Calendar',
            description: isAnalyst ? 'View your shift schedule' : 'View and manage shift assignments',
            link: '/calendar-standard',
            color: 'bg-green-500',
            show: true, // All users
        },
        {
            icon: Layout,
            title: 'Advanced Calendar',
            description: 'Detailed shift view with quick assignment',
            link: '/calendar-advanced',
            color: 'bg-indigo-500',
            show: canManage,
        },
        {
            icon: Clock,
            title: 'Standby Management',
            description: 'Track Level 2 analyst standby assignments',
            link: '/standby',
            color: 'bg-yellow-500',
            show: canManage,
        },
        {
            icon: BarChart3,
            title: isAnalyst ? 'My Analytics' : 'Analytics & Reports',
            description: isAnalyst ? 'View your shift statistics and hours' : 'Team analytics with multiplier breakdowns',
            link: '/analytics',
            color: 'bg-purple-500',
            show: true, // All users
        },
        {
            icon: Settings,
            title: 'Pay Rules',
            description: 'Configure premium pay multipliers',
            link: '/pay-rules',
            color: 'bg-orange-500',
            show: canViewPayRules,
        },
        {
            icon: User,
            title: 'User Management',
            description: 'Manage system users and permissions',
            link: '/users',
            color: 'bg-red-500',
            show: canViewPayRules,
        },
    ];

    // Filter features based on role permissions
    const features = allFeatures.filter(feature => feature.show);

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">SH</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Space Hellas S.A.</h1>
                        <p className="text-gray-500 text-sm">SOC Level 1 Shift Management System</p>
                    </div>
                </div>
                <p className="text-gray-600 mt-4">
                    {isAnalyst
                        ? 'Welcome! Use the modules below to view your shift calendar and track your work hours.'
                        : 'Welcome to the internal shift management platform for SOC Level 1 analysts. Use the modules below to manage shifts, view analytics, and configure pay rules.'
                    }
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <Link key={feature.title} to={feature.link}>
                            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full cursor-pointer">
                                <div
                                    className={`${feature.color} text-white p-3 rounded-lg w-fit mb-4`}
                                >
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm">{feature.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-8 bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">System Information</h2>
                <p className="text-gray-700 text-sm">
                    This platform tracks shift assignments and calculates Greek labor law compliant pay multipliers for SOC Level 1 analysts. All shift data is stored with complete historical records for audit and payroll processing.
                </p>
            </div>
        </div>
    );
}
