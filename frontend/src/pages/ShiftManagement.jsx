import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';
import { shiftAPI, analystAPI } from '../api';
import { format } from 'date-fns';

export default function ShiftManagement() {
    const today = new Date();
    const defaultStartDate = format(today, 'yyyy-MM-dd');
    const defaultEndDate = format(new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

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
    const [assignmentMode, setAssignmentMode] = useState('');

    const [generationLoading, setGenerationLoading] = useState(false);
    const [generationConfig, setGenerationConfig] = useState({
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        max_weekly_hours: 40,
        min_rest_hours: 12,
        required_coverage: {
            morning: 1,
            evening: 1,
            night: 1,
            standard: 0,
        },
        notes: 'Approved by shift manager',
    });
    const [coverageReport, setCoverageReport] = useState(null);
    const [generationPreview, setGenerationPreview] = useState(null);

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
            if (assignmentMode) params.assignment_mode = assignmentMode;

            const response = await shiftAPI.getAll(params);
            setShifts(response.data);
        } catch (err) {
            setError('Failed to filter shifts');
        }
    };

    const getGenerationPayload = () => ({
        start_date: generationConfig.start_date,
        end_date: generationConfig.end_date,
        max_weekly_hours: Number(generationConfig.max_weekly_hours),
        min_rest_hours: Number(generationConfig.min_rest_hours),
        required_coverage: {
            morning: Number(generationConfig.required_coverage.morning),
            evening: Number(generationConfig.required_coverage.evening),
            night: Number(generationConfig.required_coverage.night),
            standard: Number(generationConfig.required_coverage.standard),
        },
        notes: generationConfig.notes,
    });

    const handleCoverageScan = async () => {
        try {
            setGenerationLoading(true);
            const response = await shiftAPI.getCoverageGaps({
                start_date: generationConfig.start_date,
                end_date: generationConfig.end_date,
            });
            setCoverageReport(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch coverage report');
        } finally {
            setGenerationLoading(false);
        }
    };

    const handlePreviewAutoGeneration = async () => {
        try {
            setGenerationLoading(true);
            const response = await shiftAPI.previewAutoGenerate(getGenerationPayload());
            setGenerationPreview(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to preview auto-generation');
        } finally {
            setGenerationLoading(false);
        }
    };

    const handleApplyAutoGeneration = async () => {
        if (!window.confirm('Apply the generated schedule to the database?')) return;

        try {
            setGenerationLoading(true);
            await shiftAPI.applyAutoGenerate(getGenerationPayload());
            await fetchFiltered();
            await handleCoverageScan();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to apply auto-generated schedule');
        } finally {
            setGenerationLoading(false);
        }
    };

    const isAutoGeneratedShift = (shift) =>
        typeof shift.notes === 'string' && shift.notes.startsWith('[AUTO-GENERATED]');

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
        <div className="app-page">
            <div className="flex justify-between items-center mb-6">
                <h1 className="page-title">Shift Management</h1>
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
                    className="btn-primary"
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
            <div className="surface-card mb-6 p-4">
                <h3 className="font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-5 gap-3">
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
                    <select
                        value={assignmentMode}
                        onChange={(e) => setAssignmentMode(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Assignments</option>
                        <option value="manual">Manual Only</option>
                        <option value="auto">Auto-Generated Only</option>
                    </select>
                    <button
                        onClick={fetchFiltered}
                        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            <div className="surface-card mb-6 border-l-4 border-amber-500 p-6">
                <h2 className="text-xl font-semibold mb-2">Auto Generation (Separate From Manual Assignment)</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Generate schedule proposals in preview mode first, then apply only after approval.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                        type="date"
                        value={generationConfig.start_date}
                        onChange={(e) =>
                            setGenerationConfig({ ...generationConfig, start_date: e.target.value })
                        }
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="date"
                        value={generationConfig.end_date}
                        onChange={(e) =>
                            setGenerationConfig({ ...generationConfig, end_date: e.target.value })
                        }
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        min="1"
                        value={generationConfig.max_weekly_hours}
                        onChange={(e) =>
                            setGenerationConfig({ ...generationConfig, max_weekly_hours: e.target.value })
                        }
                        className="border rounded px-3 py-2"
                        placeholder="Max weekly hours"
                    />
                    <input
                        type="number"
                        min="1"
                        value={generationConfig.min_rest_hours}
                        onChange={(e) =>
                            setGenerationConfig({ ...generationConfig, min_rest_hours: e.target.value })
                        }
                        className="border rounded px-3 py-2"
                        placeholder="Minimum rest hours"
                    />
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                    <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Morning coverage</span>
                        <input
                            type="number"
                            min="0"
                            value={generationConfig.required_coverage.morning}
                            onChange={(e) =>
                                setGenerationConfig({
                                    ...generationConfig,
                                    required_coverage: {
                                        ...generationConfig.required_coverage,
                                        morning: e.target.value,
                                    },
                                })
                            }
                            className="border rounded px-3 py-2 w-full"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Evening coverage</span>
                        <input
                            type="number"
                            min="0"
                            value={generationConfig.required_coverage.evening}
                            onChange={(e) =>
                                setGenerationConfig({
                                    ...generationConfig,
                                    required_coverage: {
                                        ...generationConfig.required_coverage,
                                        evening: e.target.value,
                                    },
                                })
                            }
                            className="border rounded px-3 py-2 w-full"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Night coverage</span>
                        <input
                            type="number"
                            min="0"
                            value={generationConfig.required_coverage.night}
                            onChange={(e) =>
                                setGenerationConfig({
                                    ...generationConfig,
                                    required_coverage: {
                                        ...generationConfig.required_coverage,
                                        night: e.target.value,
                                    },
                                })
                            }
                            className="border rounded px-3 py-2 w-full"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Standard coverage</span>
                        <input
                            type="number"
                            min="0"
                            value={generationConfig.required_coverage.standard}
                            onChange={(e) =>
                                setGenerationConfig({
                                    ...generationConfig,
                                    required_coverage: {
                                        ...generationConfig.required_coverage,
                                        standard: e.target.value,
                                    },
                                })
                            }
                            className="border rounded px-3 py-2 w-full"
                        />
                    </label>
                </div>

                <textarea
                    value={generationConfig.notes}
                    onChange={(e) =>
                        setGenerationConfig({ ...generationConfig, notes: e.target.value })
                    }
                    className="border rounded px-3 py-2 w-full mb-4"
                    rows="2"
                    placeholder="Approval note for generated shifts"
                />

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleCoverageScan}
                        disabled={generationLoading}
                        className="rounded-md bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {generationLoading ? 'Working...' : 'Check Coverage Gaps'}
                    </button>
                    <button
                        onClick={handlePreviewAutoGeneration}
                        disabled={generationLoading}
                        className="rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                        {generationLoading ? 'Working...' : 'Preview Auto Generation'}
                    </button>
                    <button
                        onClick={handleApplyAutoGeneration}
                        disabled={generationLoading || !generationPreview}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {generationLoading ? 'Working...' : 'Approve & Apply'}
                    </button>
                </div>

                {coverageReport && (
                    <div className="mb-4 rounded border border-slate-200 p-3">
                        <h3 className="font-semibold mb-2">Coverage Report</h3>
                        <p className="text-sm text-gray-700 mb-2">
                            Total gaps in range: {coverageReport.total_gaps}
                        </p>
                        {coverageReport.total_gaps > 0 && (
                            <div className="max-h-40 overflow-auto text-sm text-gray-700">
                                {coverageReport.gaps.slice(0, 12).map((gap, idx) => (
                                    <p key={`${gap.date}-${gap.shift_type}-${idx}`}>
                                        {gap.date} | {gap.shift_type}: missing {gap.missing}
                                    </p>
                                ))}
                                {coverageReport.gaps.length > 12 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Showing first 12 gaps...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {generationPreview && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                        <h3 className="font-semibold mb-2">Generation Preview</h3>
                        <p>Planned shifts: {generationPreview.planned_count}</p>
                        <p>Gaps before: {generationPreview.gaps_before.length}</p>
                        <p>Gaps after: {generationPreview.gaps_after.length}</p>
                        {generationPreview.warnings?.length > 0 && (
                            <div className="mt-2">
                                <p className="font-semibold">Warnings:</p>
                                {generationPreview.warnings.map((warning, idx) => (
                                    <p key={`${warning}-${idx}`}>- {warning}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="surface-card mb-6 border-l-4 border-blue-500 p-6"
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
                            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
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
                            className="btn-secondary"
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
                            className="surface-card border-l-4 border-indigo-500 p-4"
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
                                    <div className="mt-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${isAutoGeneratedShift(shift)
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}
                                        >
                                            {isAutoGeneratedShift(shift) ? 'Auto-Generated' : 'Manual Assignment'}
                                        </span>
                                    </div>
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
