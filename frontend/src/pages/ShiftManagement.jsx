import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';
import { shiftAPI, analystAPI } from '../api';
import { format } from 'date-fns';

export default function ShiftManagement() {
    const [shifts, setShifts] = useState([]);
    const [analysts, setAnalysts] = useState([]);
    const [shiftTemplates, setShiftTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterAnalystId, setFilterAnalystId] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [formData, setFormData] = useState({
        analyst_id: '',
        shift_date: '',
        shift_type: 'standard',
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [shiftsRes, analystsRes, templatesRes] = await Promise.all([
                shiftAPI.getAll({}),
                analystAPI.getAll(),
                shiftAPI.getTemplates(),
            ]);
            setShifts(shiftsRes.data);
            setAnalysts(analystsRes.data);
            setShiftTemplates(templatesRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFiltered = async () => {
        try {
            const params = {};
            if (filterAnalystId) params.analyst_id = filterAnalystId;
            if (filterStartDate) params.start_date = filterStartDate;
            if (filterEndDate) params.end_date = filterEndDate;

            const response = await shiftAPI.getAll(params);
            setShifts(response.data);
        } catch (err) {
            setError('Failed to filter shifts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.analyst_id || !formData.shift_date || !formData.shift_type) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            if (editingId) {
                await shiftAPI.update(editingId, formData);
            } else {
                await shiftAPI.create(formData);
            }
            await fetchData();
            setShowForm(false);
            setEditingId(null);
            setFormData({
                analyst_id: '',
                shift_date: '',
                shift_type: 'standard',
                notes: '',
            });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save shift');
            console.error(err);
        }
    };

    const handleEdit = (shift) => {
        setFormData({
            analyst_id: shift.analyst_id,
            shift_date: shift.shift_date,
            shift_type: shift.shift_type,
            notes: shift.notes || '',
        });
        setEditingId(shift.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await shiftAPI.delete(id);
            await fetchData();
        } catch (err) {
            setError('Failed to delete shift');
        }
    };

    const getPayMultiplierColor = (multiplier) => {
        if (multiplier >= 1.75) return 'bg-red-100 text-red-800';
        if (multiplier >= 1.5) return 'bg-orange-100 text-orange-800';
        return 'bg-green-100 text-green-800';
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Shift Management</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({
                            analyst_id: '',
                            shift_date: '',
                            shift_type: 'standard',
                            notes: '',
                        });
                        setError(null);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                >
                    <Plus size={20} /> Assign Shift
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-4 gap-3">
                    <select
                        value={filterAnalystId}
                        onChange={(e) => setFilterAnalystId(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Analysts</option>
                        {analysts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.first_name} {a.last_name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="border rounded px-3 py-2"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="border rounded px-3 py-2"
                        placeholder="End Date"
                    />
                    <button
                        onClick={fetchFiltered}
                        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500"
                >
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Edit Shift' : 'Assign New Shift'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <select
                            value={formData.analyst_id}
                            onChange={(e) =>
                                setFormData({ ...formData, analyst_id: parseInt(e.target.value) })
                            }
                            className="border rounded px-3 py-2 col-span-2"
                            required
                            disabled={editingId !== null}
                        >
                            <option value="">Select Analyst *</option>
                            {analysts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.first_name} {a.last_name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={formData.shift_date}
                            onChange={(e) =>
                                setFormData({ ...formData, shift_date: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        />
                        <select
                            value={formData.shift_type}
                            onChange={(e) =>
                                setFormData({ ...formData, shift_type: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        >
                            <option value="">Select Shift Type *</option>
                            {shiftTemplates.map((template) => (
                                <option key={template.type} value={template.type}>
                                    {template.label}
                                </option>
                            ))}
                        </select>
                        <textarea
                            placeholder="Notes (optional)"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            className="border rounded px-3 py-2 col-span-2"
                            rows="2"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            {editingId ? 'Update' : 'Create'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setError(null);
                            }}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {shifts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No shifts found.
                    </div>
                ) : (
                    shifts.map((shift) => (
                        <div
                            key={shift.id}
                            className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">
                                        {shift.analyst_name}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {format(new Date(shift.shift_date), 'EEEE, dd MMM yyyy')} |{' '}
                                        {shift.start_time.substring(0, 5)} -{' '}
                                        {shift.end_time.substring(0, 5)}
                                    </p>
                                    <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Hours:</span>
                                            <p className="font-semibold">{shift.hours_worked.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Base Pay:</span>
                                            <p className="font-semibold">€{shift.base_pay.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getPayMultiplierColor(shift.pay_multiplier)}`}>
                                                {shift.pay_multiplier}x Multiplier
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Pay:</span>
                                            <p className="font-semibold text-green-600">
                                                €{shift.total_pay.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {shift.notes && (
                                        <p className="text-gray-500 text-sm mt-2">
                                            <span className="font-semibold">Notes:</span> {shift.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(shift)}
                                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(shift.id)}
                                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
