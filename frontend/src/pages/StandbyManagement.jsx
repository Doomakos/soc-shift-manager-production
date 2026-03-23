import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const StandbyManagement = () => {
    const [standbyWeeks, setStandbyWeeks] = useState([]);
    const [l2Analysts, setL2Analysts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [selectedAnalyst, setSelectedAnalyst] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [weekEnd, setWeekEnd] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchStandbyWeeks();
        fetchL2Analysts();
    }, []);

    const fetchStandbyWeeks = async () => {
        try {
            const response = await axios.get(`${API_URL}/standby`);
            setStandbyWeeks(response.data);
        } catch (err) {
            setError('Failed to fetch standby weeks');
        }
    };

    const fetchL2Analysts = async () => {
        try {
            const response = await axios.get(`${API_URL}/analysts/l2`);
            setL2Analysts(response.data);
        } catch (err) {
            setError('Failed to fetch L2 analysts');
        }
    };

    const getMonday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const getSunday = (date) => {
        const monday = getMonday(date);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    };

    const handleWeekStartChange = (value) => {
        setWeekStart(value);
        if (value) {
            const monday = getMonday(value);
            const sunday = getSunday(value);
            setWeekStart(monday.toISOString().split('T')[0]);
            setWeekEnd(sunday.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post(`${API_URL}/standby`, {
                analyst_id: parseInt(selectedAnalyst),
                week_start: weekStart,
                week_end: weekEnd,
                notes: notes
            });

            // Reset form
            setSelectedAnalyst('');
            setWeekStart('');
            setWeekEnd('');
            setNotes('');

            // Refresh list
            fetchStandbyWeeks();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign standby week');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this standby assignment?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/standby/${id}`);
            fetchStandbyWeeks();
        } catch (err) {
            setError('Failed to delete standby week');
        }
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">L2 Standby Management</h1>

            {l2Analysts.length === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                No L2 analysts found. Please update analyst levels in Analyst Management to assign standby weeks.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Form */}
            {l2Analysts.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Assign Standby Week</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    L2 Analyst *
                                </label>
                                <select
                                    value={selectedAnalyst}
                                    onChange={(e) => setSelectedAnalyst(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select analyst...</option>
                                    {l2Analysts.map((analyst) => (
                                        <option key={analyst.id} value={analyst.id}>
                                            {analyst.first_name} {analyst.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Week (any day) *
                                </label>
                                <input
                                    type="date"
                                    value={weekStart}
                                    onChange={(e) => handleWeekStartChange(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {weekStart && weekEnd && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Week: {new Date(weekStart).toLocaleDateString('el-GR')} - {new Date(weekEnd).toLocaleDateString('el-GR')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional notes..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                        >
                            {loading ? 'Assigning...' : 'Assign Standby Week'}
                        </button>
                    </form>
                </div>
            )}

            {/* Standby Weeks List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Standby Schedule</h2>
                </div>

                {standbyWeeks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No standby weeks assigned yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Week
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        L2 Analyst
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {standbyWeeks.map((week) => (
                                    <tr key={week.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {week.week_display}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{week.analyst_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{week.notes || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(week.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandbyManagement;
