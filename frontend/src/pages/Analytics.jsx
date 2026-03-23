import React, { useState, useEffect } from 'react';
import { analyticsAPI, analystAPI } from '../api';
import { Loader, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';

export default function Analytics() {
    const { user, hasRole } = useAuth();
    const isAnalyst = hasRole('l1_analyst', 'l2_analyst');
    const canViewAll = hasRole('admin', 'soc_manager', 'shift_coordinator', 'hr_payroll');
    // Helper functions for date conversion (Greece format: DD/MM/YYYY)
    const formatDateToISO = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD
    const formatDateToGreece = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        return `${day}/${month}/${year}`;
    };
    const formatDateFromGreece = (greeceDate) => {
        if (!greeceDate) return '';
        const [day, month, year] = greeceDate.split('/');
        return `${year}-${month}-${day}`;
    };
    const isValidDate = (dateStr) => {
        if (!dateStr || dateStr.length !== 10) return false;
        const [day, month, year] = dateStr.split('/');
        if (!day || !month || !year) return false;
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return false;
        const date = new Date(y, m - 1, d);
        return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y;
    };

    // Get current month's date range
    const getCurrentMonthRange = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Create date in UTC to avoid timezone issues
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month + 1, 0));

        return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0]
        };
    };

    const monthRange = getCurrentMonthRange();

    const [analysts, setAnalysts] = useState([]);
    const [selectedAnalystId, setSelectedAnalystId] = useState('');
    const [startDate, setStartDate] = useState(new Date(monthRange.start)); // Store as Date object for DatePicker
    const [endDate, setEndDate] = useState(new Date(monthRange.end)); // Store as Date object for DatePicker
    const [analyticsData, setAnalyticsData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [allAnalystsData, setAllAnalystsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('team');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const response = await analystAPI.getAll();
            setAnalysts(response.data);

            // If user is an analyst, auto-select their own data
            if (isAnalyst && user.analyst_id) {
                setSelectedAnalystId(user.analyst_id.toString());
                setActiveTab('individual');

                // Fetch their analytics immediately
                const params = {
                    start_date: monthRange.start,
                    end_date: monthRange.end
                };
                const summaryResponse = await analyticsAPI.getAnalystSummary(user.analyst_id, params);
                setAnalyticsData(summaryResponse.data);
            } else if (canViewAll) {
                // Load team data for managers
                const params = {
                    start_date: monthRange.start,
                    end_date: monthRange.end
                };
                const summaryResponse = await analyticsAPI.getTeamSummary(params);
                setTeamData(summaryResponse.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalystQuery = async (analystId = null) => {
        const idToUse = analystId || selectedAnalystId;
        if (!idToUse) return;

        try {
            setLoading(true);
            const params = {};
            if (startDate) params.start_date = formatDateToISO(startDate);
            if (endDate) params.end_date = formatDateToISO(endDate);

            const summaryResponse = await analyticsAPI.getAnalystSummary(parseInt(idToUse), params);
            setAnalyticsData(summaryResponse.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTeamQuery = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.start_date = formatDateToISO(startDate);
            if (endDate) params.end_date = formatDateToISO(endDate);

            const summaryResponse = await analyticsAPI.getTeamSummary(params);
            setTeamData(summaryResponse.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAllAnalystsQuery = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.start_date = formatDateToISO(startDate);
            if (endDate) params.end_date = formatDateToISO(endDate);

            // Fetch summary data for all analysts
            const promises = analysts.map(analyst =>
                analyticsAPI.getAnalystSummary(analyst.id, params)
                    .then(response => ({
                        ...analyst,
                        summary: response.data
                    }))
                    .catch(err => {
                        console.error(`Error fetching data for ${analyst.first_name}:`, err);
                        return null;
                    })
            );

            const results = await Promise.all(promises);
            setAllAnalystsData(results.filter(r => r !== null));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
            <p className="text-gray-600 mb-8">Shift metrics for payroll team processing</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                {canViewAll && (
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 font-semibold ${activeTab === 'team'
                            ? 'border-b-2 border-blue-500 text-blue-500'
                            : 'text-gray-600'
                            }`}
                    >
                        Team Summary
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('individual')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'individual'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-600'
                        }`}
                >
                    {isAnalyst ? 'My Analytics' : 'Individual Analyst'}
                </button>
                {canViewAll && (
                    <button
                        onClick={() => {
                            setActiveTab('all');
                            handleAllAnalystsQuery();
                        }}
                        className={`px-4 py-2 font-semibold ${activeTab === 'all'
                            ? 'border-b-2 border-blue-500 text-blue-500'
                            : 'text-gray-600'
                            }`}
                    >
                        All Analysts
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-semibold mb-3">Date Range Filter</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="DD/MM/YYYY"
                                className="border rounded px-3 py-2 pl-10 w-full"
                                wrapperClassName="w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="DD/MM/YYYY"
                                minDate={startDate}
                                className="border rounded px-3 py-2 pl-10 w-full"
                                wrapperClassName="w-full"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!startDate || !endDate) {
                                alert('Please select both start and end dates');
                                return;
                            }
                            if (activeTab === 'team') handleTeamQuery();
                            else if (activeTab === 'all') handleAllAnalystsQuery();
                            else {
                                // For analysts, pass their analyst_id directly
                                if (isAnalyst && user.analyst_id) {
                                    handleAnalystQuery(user.analyst_id);
                                } else {
                                    handleAnalystQuery();
                                }
                            }
                        }}
                        disabled={loading || !startDate || !endDate}
                        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader className="animate-spin" size={16} />}
                        Update Report
                    </button>
                </div>
            </div>

            {/* Team Summary */}
            {activeTab === 'team' && teamData && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                            <h3 className="text-gray-600 text-sm font-semibold">Total Shifts</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {teamData.total_shifts}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                            <h3 className="text-gray-600 text-sm font-semibold">Total Hours Worked</h3>
                            <p className="text-3xl font-bold text-purple-600">
                                {teamData.total_hours}h
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                            <h3 className="text-gray-600 text-sm font-semibold">Analysts Involved</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {teamData.num_analysts}
                            </p>
                        </div>
                    </div>

                    {/* Team Multiplier Breakdown */}
                    {teamData.multiplier_breakdown && teamData.multiplier_breakdown.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="font-semibold text-lg mb-4">Team Hours by Multiplier Rule</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {teamData.multiplier_breakdown.map((breakdown, idx) => (
                                    <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-600 uppercase font-semibold">{breakdown.rule_type}</p>
                                                <p className="text-2xl font-bold text-gray-800 mt-1">{breakdown.hours}h</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xl font-bold ${breakdown.multiplier > 1 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                    {breakdown.multiplier}x
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-gray-600">
                                    <span className="font-semibold">For Payroll Team:</span> Apply base rate to each hours segment with its multiplier.
                                    Total Payment = Σ(Hours × Base Rate × Multiplier) for all segments.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Period Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Period:</span> {formatDateToGreece(teamData.period.start_date) || 'All time'} to {formatDateToGreece(teamData.period.end_date) || 'Present'}
                        </p>
                    </div>
                </div>
            )}

            {/* Individual Analyst */}
            {activeTab === 'individual' && (
                <div className="space-y-6">
                    {/* Info banner for analysts viewing their own data */}
                    {isAnalyst && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                📊 <span className="font-semibold">Viewing your analytics</span> - Use the date range filter above to adjust the period
                            </p>
                        </div>
                    )}

                    {/* Analyst Selector - only show for management */}
                    {canViewAll && (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <label className="block text-sm font-semibold mb-2">Select Analyst</label>
                            <select
                                value={selectedAnalystId}
                                onChange={(e) => setSelectedAnalystId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">-- Choose an analyst --</option>
                                {analysts.map((analyst) => (
                                    <option key={analyst.id} value={analyst.id}>
                                        {analyst.first_name} {analyst.last_name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-600 mt-2">
                                Select an analyst and use the "Update Report" button above to view their data
                            </p>
                        </div>
                    )}

                    {/* Analyst Data */}
                    {analyticsData && (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                                    <h3 className="text-gray-600 text-sm font-semibold">Total Shifts</h3>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {analyticsData.total_shifts}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                                    <h3 className="text-gray-600 text-sm font-semibold">Total Hours</h3>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {analyticsData.total_hours}h
                                    </p>
                                </div>
                            </div>

                            {/* Shift Type Breakdown */}
                            {analyticsData.shift_type_breakdown && Object.keys(analyticsData.shift_type_breakdown).length > 0 && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="font-semibold text-lg mb-4">Shift Type Breakdown</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(analyticsData.shift_type_breakdown).map(([type, count]) => (
                                            <div key={type} className="bg-gray-50 p-4 rounded text-center">
                                                <p className="text-xs text-gray-600 uppercase mb-1">{type.replace('_', ' ')}</p>
                                                <p className="text-2xl font-bold text-gray-700">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Shift List */}
                            {analyticsData.detailed_shifts && analyticsData.detailed_shifts.length > 0 && (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="bg-gray-100 px-6 py-3 border-b">
                                        <h3 className="font-semibold text-lg">Detailed Shift Information for Payroll Calculation</h3>
                                        <p className="text-sm text-gray-600">All shift details with calculation multipliers</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Day</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Shift Type</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Hours</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Multiplier</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {analyticsData.detailed_shifts.map((shift, idx) => (
                                                    <React.Fragment key={shift.shift_id}>
                                                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                            <td className="px-4 py-3 whitespace-nowrap font-medium">{shift.date}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">{shift.day_of_week}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${shift.shift_type === 'morning' ? 'bg-yellow-100 text-yellow-800' :
                                                                    shift.shift_type === 'evening' ? 'bg-orange-100 text-orange-800' :
                                                                        shift.shift_type === 'night' ? 'bg-blue-100 text-blue-800' :
                                                                            shift.shift_type === 'day_off' ? 'bg-gray-100 text-gray-800' :
                                                                                'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {shift.shift_type.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                                {shift.start_time && shift.end_time ? `${shift.start_time} - ${shift.end_time}` : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">{shift.hours_worked}h</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`font-bold ${shift.pay_multiplier > 1 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                                    {shift.pay_multiplier}x
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600">{shift.work_location || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 text-xs">{shift.notes || '-'}</td>
                                                        </tr>
                                                        {/* Multiplier Breakdown Row */}
                                                        {shift.multiplier_breakdown && shift.multiplier_breakdown.length > 0 && (
                                                            <tr className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'}>
                                                                <td colSpan="8" className="px-4 py-2">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <span className="font-semibold text-gray-700">Multiplier Breakdown:</span>
                                                                        {shift.multiplier_breakdown.map((breakdown, bidx) => (
                                                                            <span key={bidx} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200">
                                                                                <span className="text-gray-700">{breakdown.hours}h</span>
                                                                                <span className="text-gray-400">×</span>
                                                                                <span className="font-bold text-orange-600">{breakdown.multiplier}x</span>
                                                                                <span className="text-xs text-gray-500">({breakdown.rule_type})</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Period Info & Instructions */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Period:</span> {formatDateToGreece(analyticsData.period.start_date) || 'All time'} to {formatDateToGreece(analyticsData.period.end_date) || 'Present'}
                                </p>
                                <p className="text-xs text-gray-600">
                                    <span className="font-semibold">For Payroll Team:</span> Use Hours × Base Rate × Multiplier for each shift to calculate final payment
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* All Analysts */}
            {activeTab === 'all' && allAnalystsData.length > 0 && (
                <div className="space-y-4">
                    {allAnalystsData.map((analyst, idx) => (
                        <div key={analyst.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Analyst Header */}
                            <div className={`p-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {analyst.first_name} {analyst.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">Employee ID: {analyst.employee_id}</p>
                                    </div>
                                    <div className="flex gap-6 text-center">
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase">Shifts</p>
                                            <p className="text-2xl font-bold text-blue-600">{analyst.summary.total_shifts}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 uppercase">Total Hours</p>
                                            <p className="text-2xl font-bold text-purple-600">{analyst.summary.total_hours}h</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Multiplier Breakdown */}
                            {analyst.summary.detailed_shifts && (() => {
                                // Aggregate multiplier breakdown for this analyst
                                const analystBreakdown = {};
                                analyst.summary.detailed_shifts.forEach(shift => {
                                    if (shift.multiplier_breakdown) {
                                        shift.multiplier_breakdown.forEach(mb => {
                                            const key = `${mb.rule_type}_${mb.multiplier}`;
                                            if (!analystBreakdown[key]) {
                                                analystBreakdown[key] = {
                                                    rule_type: mb.rule_type,
                                                    multiplier: mb.multiplier,
                                                    hours: 0
                                                };
                                            }
                                            analystBreakdown[key].hours += mb.hours;
                                        });
                                    }
                                });

                                const breakdownArray = Object.values(analystBreakdown)
                                    .sort((a, b) => a.multiplier - b.multiplier);

                                return breakdownArray.length > 0 ? (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Hours by Multiplier Rule:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {breakdownArray.map((breakdown, bidx) => (
                                                <div key={bidx} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm">
                                                    <span className="text-sm text-gray-700 font-medium">{breakdown.hours.toFixed(2)}h</span>
                                                    <span className="text-gray-400">×</span>
                                                    <span className={`text-sm font-bold ${breakdown.multiplier > 1 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                        {breakdown.multiplier}x
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {breakdown.rule_type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    ))}

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">For Payroll Team:</span> Each analyst's hours are broken down by multiplier rule.
                            Apply the base hourly rate to each segment: Payment = Σ(Hours × Base Rate × Multiplier)
                        </p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {activeTab === 'all' && allAnalystsData.length === 0 && (
                <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-600">
                    <p>Click "Update Report" to generate all analysts report</p>
                </div>
            )}
        </div>
    );
}
