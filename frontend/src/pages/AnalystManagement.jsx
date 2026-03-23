import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';
import { analystAPI } from '../api';

export default function AnalystManagement() {
    const [analysts, setAnalysts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        base_hourly_rate: '',
        analyst_level: 'L1',
    });

    useEffect(() => {
        fetchAnalysts();
    }, []);

    const fetchAnalysts = async () => {
        try {
            setLoading(true);
            const response = await analystAPI.getAll();
            setAnalysts(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load analysts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await analystAPI.update(editingId, formData);
            } else {
                await analystAPI.create(formData);
            }
            fetchAnalysts();
            setShowForm(false);
            setEditingId(null);
            setFormData({
                employee_id: '',
                first_name: '',
                last_name: '',
                email: '',
                base_hourly_rate: '',
                analyst_level: 'L1',
            });
        } catch (err) {
            setError('Failed to save analyst');
            console.error(err);
        }
    };

    const handleEdit = (analyst) => {
        setFormData(analyst);
        setEditingId(analyst.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await analystAPI.delete(id);
            fetchAnalysts();
        } catch (err) {
            setError('Failed to delete analyst');
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">SOC Analysts Management</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({
                            employee_id: '',
                            first_name: '',
                            last_name: '',
                            email: '',
                            base_hourly_rate: '',
                        });
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                >
                    <Plus size={20} /> Add Analyst
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500"
                >
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Edit Analyst' : 'Add New Analyst'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Employee ID"
                            value={formData.employee_id}
                            onChange={(e) =>
                                setFormData({ ...formData, employee_id: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                            disabled={editingId !== null}
                        />
                        <input
                            type="text"
                            placeholder="First Name"
                            value={formData.first_name}
                            onChange={(e) =>
                                setFormData({ ...formData, first_name: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={formData.last_name}
                            onChange={(e) =>
                                setFormData({ ...formData, last_name: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Base Hourly Rate"
                            value={formData.base_hourly_rate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    base_hourly_rate: parseFloat(e.target.value),
                                })
                            }
                            className="border rounded px-3 py-2"
                            required
                            step="0.01"
                            min="0"
                        />
                        <select
                            value={formData.analyst_level}
                            onChange={(e) =>
                                setFormData({ ...formData, analyst_level: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        >
                            <option value="L1">Level 1 (Shift Work)</option>
                            <option value="L2">Level 2 (Standby)</option>
                        </select>
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
                            }}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {analysts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No analysts found. Create one to get started.
                    </div>
                ) : (
                    analysts.map((analyst) => (
                        <div
                            key={analyst.id}
                            className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">
                                            {analyst.first_name} {analyst.last_name}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${analyst.analyst_level === 'L2'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {analyst.analyst_level || 'L1'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm">
                                        ID: {analyst.employee_id} | Email: {analyst.email}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-semibold">Base Rate:</span> €
                                        {analyst.base_hourly_rate}/hour
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        Status: <span className="capitalize">{analyst.status}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(analyst)}
                                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(analyst.id)}
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
