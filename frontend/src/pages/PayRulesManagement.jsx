import React, { useState, useEffect } from 'react';
import { payRuleAPI } from '../api';
import { Plus, Trash2, Loader } from 'lucide-react';

const DAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

export default function PayRulesManagement() {
    const [rules, setRules] = useState([]);
    const [configWarnings, setConfigWarnings] = useState([]);
    const [previewResult, setPreviewResult] = useState(null);
    const [previewDate, setPreviewDate] = useState(new Date().toISOString().slice(0, 10));
    const [previewTime, setPreviewTime] = useState('22:00');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        rule_name: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        multiplier: 1.0,
        description: '',
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await payRuleAPI.getAll();
            setRules(response.data);

            try {
                const validationResponse = await payRuleAPI.validate();
                setConfigWarnings(validationResponse.data.warnings || []);
            } catch (validationErr) {
                console.error('Failed to validate pay rule configuration:', validationErr);
                setConfigWarnings([]);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load pay rules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!previewDate || !previewTime) {
            setError('Please select both preview date and time');
            return;
        }

        try {
            const response = await payRuleAPI.evaluate({
                date: previewDate,
                time: previewTime,
            });
            setPreviewResult(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to evaluate preview');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                day_of_week:
                    formData.day_of_week === '' ? null : parseInt(formData.day_of_week),
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
            };
            await payRuleAPI.create(data);
            fetchRules();
            setShowForm(false);
            setFormData({
                rule_name: '',
                day_of_week: '',
                start_time: '',
                end_time: '',
                multiplier: 1.0,
                description: '',
            });
        } catch (err) {
            setError('Failed to create pay rule');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await payRuleAPI.update(id, { active: false });
            fetchRules();
        } catch (err) {
            setError('Failed to delete pay rule');
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
        <div className="app-page">
            <div className="flex justify-between items-center mb-6">
                <h1 className="page-title">Pay Rules Configuration</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                >
                    <Plus size={20} /> Add Pay Rule
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {configWarnings.length > 0 && (
                <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <h3 className="mb-2 font-semibold text-amber-900">Configuration Warnings</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                        {configWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="surface-card mb-6 p-6">
                <h2 className="mb-4 text-xl font-semibold">Rule Preview</h2>
                <p className="mb-4 text-sm text-gray-600">
                    Simulate which multiplier applies for a specific day and time before changing payroll logic.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <input
                        type="date"
                        value={previewDate}
                        onChange={(e) => setPreviewDate(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="time"
                        value={previewTime}
                        onChange={(e) => setPreviewTime(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="btn-primary"
                    >
                        Evaluate
                    </button>
                    {previewResult && (
                        <div className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                            <div><strong>Multiplier:</strong> {previewResult.multiplier}x</div>
                            <div><strong>Rule:</strong> {previewResult.rule_source}</div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="surface-card mb-6 border-l-4 border-blue-500 p-6"
                >
                    <h2 className="text-xl font-semibold mb-4">Add New Pay Rule</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Rule Name"
                            value={formData.rule_name}
                            onChange={(e) =>
                                setFormData({ ...formData, rule_name: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                            required
                        />
                        <select
                            value={formData.day_of_week}
                            onChange={(e) =>
                                setFormData({ ...formData, day_of_week: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                        >
                            <option value="">All Days (Default)</option>
                            {DAY_NAMES.map((day, idx) => (
                                <option key={idx} value={idx}>
                                    {day}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Pay Multiplier"
                            value={formData.multiplier}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    multiplier: parseFloat(e.target.value),
                                })
                            }
                            className="border rounded px-3 py-2"
                            required
                            step="0.05"
                            min="0"
                        />
                        <input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) =>
                                setFormData({ ...formData, start_time: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                        />
                        <input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) =>
                                setFormData({ ...formData, end_time: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                        />
                        <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="border rounded px-3 py-2 col-span-2"
                            rows="2"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                        >
                            Create Rule
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {rules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No pay rules configured.
                    </div>
                ) : (
                    rules.map((rule) => (
                        <div
                            key={rule.id}
                            className="surface-card border-l-4 border-indigo-500 p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{rule.rule_name}</h3>
                                    <p className="text-gray-600 text-sm">
                                        {rule.day_of_week !== null
                                            ? `Applies on: ${DAY_NAMES[rule.day_of_week]}`
                                            : 'Applies on: All Days (Default)'}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {rule.start_time && rule.end_time
                                            ? `Time range: ${rule.start_time} - ${rule.end_time}`
                                            : 'Time range: Full day'}
                                    </p>
                                    <p className="text-gray-700 font-semibold mt-2">
                                        Multiplier: {rule.multiplier}x
                                        {rule.multiplier > 1 &&
                                            ` (+${((rule.multiplier - 1) * 100).toFixed(0)}% bonus)`}
                                    </p>
                                    {rule.description && (
                                        <p className="text-gray-600 text-sm mt-2">
                                            {rule.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">How Pay Multipliers Work</h3>
                <ul className="space-y-2 text-gray-700">
                    <li>
                        • <strong>1.0x</strong> = Regular pay (base hourly rate)
                    </li>
                    <li>
                        • <strong>1.5x</strong> = +50% bonus
                    </li>
                    <li>
                        • <strong>1.75x</strong> = +75% bonus
                    </li>
                    <li>
                        • Rules can target all days, a specific weekday, or a time range
                    </li>
                </ul>
            </div>
        </div>
    );
}
