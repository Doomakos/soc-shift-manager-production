import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Loader,
    X,
} from 'lucide-react';
import { analystAPI, shiftAPI } from '../api';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function ShiftCalendarStandard() {
    const { user, hasRole } = useAuth();
    const canEdit = hasRole('admin', 'soc_manager', 'shift_coordinator');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [analysts, setAnalysts] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [standbyWeeks, setStandbyWeeks] = useState([]);
    const [shiftTemplates, setShiftTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Greek National Holidays (fixed and movable dates for 2025-2026)
    const greekHolidays = {
        '2025-01-01': 'Πρωτοχρονιά',
        '2025-01-06': 'Θεοφάνεια',
        '2025-03-03': 'Καθαρά Δευτέρα',
        '2025-03-25': '25η Μαρτίου',
        '2025-04-18': 'Μεγάλη Παρασκευή',
        '2025-04-20': 'Κυριακή του Πάσχα',
        '2025-04-21': 'Δευτέρα του Πάσχα',
        '2025-05-01': 'Πρωτομαγιά',
        '2025-06-08': 'Κυριακή της Πεντηκοστής',
        '2025-06-09': 'Αγίου Πνεύματος',
        '2025-08-15': 'Κοίμηση Θεοτόκου',
        '2025-10-28': '28η Οκτωβρίου',
        '2025-12-25': 'Χριστούγεννα',
        '2025-12-26': 'Σύναξη Θεοτόκου',
        '2026-01-01': 'Πρωτοχρονιά',
        '2026-01-06': 'Θεοφάνεια',
        '2026-02-23': 'Καθαρά Δευτέρα',
        '2026-03-25': '25η Μαρτίου',
        '2026-04-10': 'Μεγάλη Παρασκευή',
        '2026-04-12': 'Κυριακή του Πάσχα',
        '2026-04-13': 'Δευτέρα του Πάσχα',
        '2026-05-01': 'Πρωτομαγιά',
        '2026-05-31': 'Κυριακή της Πεντηκοστής',
        '2026-06-01': 'Αγίου Πνεύματος',
        '2026-08-15': 'Κοίμηση Θεοτόκου',
        '2026-10-28': '28η Οκτωβρίου',
        '2026-12-25': 'Χριστούγεννα',
        '2026-12-26': 'Σύναξη Θεοτόκου',
    };

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        analyst_id: null,
        shift_date: '',
        shift_type: 'morning',
        notes: '',
        work_location: 'office',
        is_edit: false,
        shift_id: null,
        is_bulk: false,
    });

    // Bulk selection state
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkSelection, setBulkSelection] = useState([]);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [analystsRes, templatesRes] = await Promise.all([
                analystAPI.getAll(),
                shiftAPI.getTemplates(),
            ]);
            setAnalysts(analystsRes.data);
            setShiftTemplates(templatesRes.data);

            // Fetch shifts for the current month
            const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const monthEnd = format(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
                'yyyy-MM-dd'
            );
            const shiftsRes = await shiftAPI.getAll({
                start_date: monthStart,
                end_date: monthEnd,
            });
            setShifts(shiftsRes.data);

            // Fetch standby weeks for the current month
            try {
                const standbyRes = await fetch(`http://localhost:5000/api/standby?start_date=${monthStart}&end_date=${monthEnd}`);
                const standbyData = await standbyRes.json();
                setStandbyWeeks(standbyData);
            } catch (err) {
                console.error('Failed to fetch standby weeks:', err);
                setStandbyWeeks([]);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInCurrentMonth = () => {
        const days = [];
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );

        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        return days;
    };

    const getShiftForAnalystOnDate = (analystId, dateStr) => {
        return shifts.find(
            (s) => s.analyst_id === analystId && s.shift_date === dateStr
        );
    };

    const openModal = (analystId, dateStr, existingShift = null) => {
        setModalData({
            analyst_id: analystId,
            shift_date: dateStr,
            shift_type: existingShift?.shift_type || 'morning',
            notes: existingShift?.notes || '',
            work_location: existingShift?.work_location || 'office',
            is_edit: !!existingShift,
            shift_id: existingShift?.id || null,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData({
            analyst_id: null,
            shift_date: '',
            shift_type: 'morning',
            notes: '',
            work_location: 'office',
            is_edit: false,
            shift_id: null,
            is_bulk: false,
        });
    };

    const handleSaveShift = async () => {
        try {
            if (modalData.is_bulk) {
                // Bulk assign to all selected cells
                const promises = bulkSelection.map((selection) =>
                    shiftAPI.create({
                        analyst_id: selection.analyst_id,
                        shift_date: selection.date_str,
                        shift_type: modalData.shift_type,
                        notes: modalData.notes,
                        work_location: modalData.work_location,
                    })
                );
                await Promise.all(promises);
                setBulkMode(false);
                setBulkSelection([]);
            } else if (modalData.is_edit && modalData.shift_id) {
                await shiftAPI.update(modalData.shift_id, {
                    shift_date: modalData.shift_date,
                    shift_type: modalData.shift_type,
                    notes: modalData.notes,
                    work_location: modalData.work_location,
                });
            } else {
                await shiftAPI.create({
                    analyst_id: modalData.analyst_id,
                    shift_date: modalData.shift_date,
                    shift_type: modalData.shift_type,
                    notes: modalData.notes,
                    work_location: modalData.work_location,
                });
            }
            await fetchData();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save shift');
            console.error(err);
        }
    };

    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm('Delete this shift?')) return;
        try {
            await shiftAPI.delete(shiftId);
            await fetchData();
            closeModal();
        } catch (err) {
            setError('Failed to delete shift');
        }
    };

    const getShiftTypeLabel = (type) => {
        const template = shiftTemplates.find(t => t.type === type);
        return template?.label || type;
    };

    const getShiftColor = (shift) => {
        if (!shift) return 'bg-white hover:bg-gray-50';

        // Color based on shift type
        switch (shift.shift_type) {
            case 'morning':
                return 'bg-cyan-100 hover:bg-cyan-200';
            case 'evening':
                return 'bg-purple-100 hover:bg-purple-200';
            case 'night':
                return 'bg-violet-200 hover:bg-violet-300';
            case 'standard':
                return 'bg-green-100 hover:bg-green-200';
            case 'day_off':
                return 'bg-gray-200 hover:bg-gray-300';
            case 'approved_leave':
                return 'bg-yellow-100 hover:bg-yellow-200';
            default:
                return 'bg-gray-100 hover:bg-gray-200';
        }
    };

    const days = getDaysInCurrentMonth();
    const monthLabel = format(currentDate, 'MMMM yyyy');

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="px-2 py-3">
            {!canEdit && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-3">
                    <strong>📖 Read-Only Mode:</strong> You can view the calendar but cannot create or edit shifts.
                </div>
            )}
            <div className="flex justify-between items-center mb-3">
                <h1 className="text-xl font-bold">Shift Calendar - Standard View</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                    >
                        <ChevronLeft size={20} /> Previous
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => {
                                if (bulkMode) {
                                    setBulkMode(false);
                                    setBulkSelection([]);
                                } else {
                                    setBulkMode(true);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${bulkMode
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                        >
                            {bulkMode ? '✖ Cancel' : '📝 Bulk Assign'}
                        </button>
                    )}
                    {bulkMode && bulkSelection.length > 0 && (
                        <button
                            onClick={() => {
                                setModalData({
                                    ...modalData,
                                    is_bulk: true,
                                });
                                setShowModal(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Assign to {bulkSelection.length} cells
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-700 hover:text-red-900 font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Calendar Table */}
            <div className="mb-2 text-center">
                <h2 className="text-lg font-semibold text-gray-700">{monthLabel}</h2>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="bg-blue-500 text-white">
                            <th className="border border-gray-300 p-1 text-left font-semibold sticky left-0 bg-blue-500 z-10" style={{ width: '100px' }}>
                                Analyst
                            </th>
                            {days.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const holiday = greekHolidays[dateStr];
                                const dayOfWeek = day.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                return (
                                    <th
                                        key={day.toISOString()}
                                        className={`border border-gray-300 p-0.5 text-center font-semibold ${holiday
                                            ? 'bg-red-600'
                                            : isWeekend
                                                ? 'bg-blue-600'
                                                : ''
                                            }`}
                                        title={holiday || ''}
                                        style={{ width: '38px', minWidth: '38px', maxWidth: '38px' }}
                                    >
                                        <div className="text-[10px]">{format(day, 'EEE').substring(0, 2)}</div>
                                        <div className="text-xs">{format(day, 'dd')}</div>
                                        {holiday && (
                                            <div className="text-[8px]">🇬🇷</div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {analysts.map((analyst) => (
                            <tr key={analyst.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-1 font-semibold bg-gray-50 sticky left-0 z-10" style={{ height: '36px' }}>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[10px] truncate" title={`${analyst.first_name} ${analyst.last_name}`}>
                                            {analyst.first_name} {analyst.last_name}
                                        </span>
                                        <span className="text-[9px] text-gray-500">
                                            {analyst.employee_id}
                                        </span>
                                    </div>
                                </td>
                                {days.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const shift = getShiftForAnalystOnDate(analyst.id, dateStr);
                                    const isSelected = bulkSelection.some(s => s.analyst_id === analyst.id && s.date_str === dateStr);

                                    return (
                                        <td
                                            key={`${analyst.id}-${dateStr}`}
                                            className={`border border-gray-300 p-0.5 text-center transition-colors ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : getShiftColor(shift)
                                                } ${bulkMode && !shift && canEdit ? 'hover:bg-blue-50' : ''}`}
                                            style={{ height: '36px', width: '38px', minWidth: '38px', maxWidth: '38px' }}
                                            onClick={() => {
                                                if (!canEdit) return; // Prevent editing for read-only users
                                                if (bulkMode && !shift) {
                                                    // Toggle selection in bulk mode
                                                    if (isSelected) {
                                                        setBulkSelection(bulkSelection.filter(s => !(s.analyst_id === analyst.id && s.date_str === dateStr)));
                                                    } else {
                                                        setBulkSelection([...bulkSelection, { analyst_id: analyst.id, date_str: dateStr }]);
                                                    }
                                                } else {
                                                    openModal(analyst.id, dateStr, shift);
                                                }
                                            }}
                                            title={shift ? `${getShiftTypeLabel(shift.shift_type)}${shift.work_location === 'remote' ? ' (Remote)' : ''}${shift.notes ? '\n' + shift.notes : ''}` : canEdit ? (bulkMode ? 'Click to select for bulk assign' : 'Click to assign shift') : 'Read-only view'}
                                        >
                                            {shift ? (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <span className="text-[9px] font-bold leading-none">
                                                        {getShiftTypeLabel(shift.shift_type)}
                                                    </span>
                                                    {shift.work_location === 'remote' && (
                                                        <span className="text-[8px] leading-none">🏠</span>
                                                    )}
                                                </div>
                                            ) : isSelected ? (
                                                <span className="text-blue-600 font-bold text-xs">✓</span>
                                            ) : (
                                                <button className="text-gray-400 hover:text-blue-500">
                                                    <Plus size={12} />
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* L2 Standby Section */}
                        {standbyWeeks.length > 0 && (
                            <>
                                <tr>
                                    <td colSpan={days.length + 1} className="border-t-4 border-purple-600 bg-purple-50 p-2 sticky left-0">
                                        <div className="font-semibold text-purple-900 flex items-center gap-2">
                                            <span className="text-lg">🚨</span>
                                            <span>L2 Standby Schedule</span>
                                        </div>
                                    </td>
                                </tr>
                                {/* Group standby weeks by analyst */}
                                {(() => {
                                    const standbyByAnalyst = {};
                                    standbyWeeks.forEach(sw => {
                                        if (!standbyByAnalyst[sw.analyst_id]) {
                                            standbyByAnalyst[sw.analyst_id] = {
                                                name: sw.analyst_name,
                                                weeks: []
                                            };
                                        }
                                        standbyByAnalyst[sw.analyst_id].weeks.push(sw);
                                    });

                                    return Object.values(standbyByAnalyst).map((analystStandby, idx) => (
                                        <tr key={`standby-${idx}`} className="hover:bg-purple-50">
                                            <td className="border border-gray-300 p-1 font-semibold bg-purple-100 sticky left-0 z-10">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-purple-800">🚨</span>
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-[10px] truncate text-purple-900" title={analystStandby.name}>
                                                            {analystStandby.name}
                                                        </span>
                                                        <span className="text-[9px] text-purple-600">L2 Standby</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {days.map((day) => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const standbyForDay = analystStandby.weeks.find(sw =>
                                                    dateStr >= sw.week_start && dateStr <= sw.week_end
                                                );

                                                return (
                                                    <td
                                                        key={`standby-${idx}-${dateStr}`}
                                                        className="border border-gray-300 p-0.5 text-center"
                                                        style={{ width: '38px', minWidth: '38px', maxWidth: '38px', height: '36px' }}
                                                    >
                                                        {standbyForDay && (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center bg-purple-500 text-white rounded"
                                                                title={`Standby: ${standbyForDay.week_display}`}
                                                            >
                                                                <span className="text-[10px] font-bold">SB</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ));
                                })()}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-white rounded-lg shadow">
                <h3 className="font-semibold mb-3 text-gray-700">Legend</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2 text-sm text-gray-600">Shift Types:</h4>
                        <div className="space-y-2">
                            {shiftTemplates.map((template) => (
                                <div key={template.type} className="flex items-center gap-2 text-sm">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded border-2 font-semibold ${template.type === 'morning' ? 'bg-cyan-100 border-cyan-300' :
                                        template.type === 'evening' ? 'bg-purple-100 border-purple-300' :
                                            template.type === 'night' ? 'bg-violet-200 border-violet-400' :
                                                template.type === 'standard' ? 'bg-green-100 border-green-300' :
                                                    template.type === 'day_off' ? 'bg-gray-200 border-gray-400' :
                                                        template.type === 'approved_leave' ? 'bg-yellow-100 border-yellow-400' :
                                                            'bg-gray-100 border-gray-300'
                                        }`}>
                                        {template.label.charAt(0)}
                                    </span>
                                    <span>{template.label}</span>
                                    <span className="text-xs text-gray-500">
                                        ({template.start_time} - {template.end_time})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-sm text-gray-600">Symbols:</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🏠</span>
                                <span>Remote Work</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🇬🇷</span>
                                <span>Greek National Holiday</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded">
                                    S/S
                                </span>
                                <span>Weekend</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded text-xs font-bold">
                                    SB
                                </span>
                                <span>L2 Standby (Weekly On-Call)</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-gray-700">
                                <strong>💡 Tip:</strong> Click any cell to assign or edit a shift.
                                Empty cells show a + icon to add new shifts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit Shift */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {modalData.is_bulk
                                    ? `Bulk Assign (${bulkSelection.length} cells)`
                                    : modalData.is_edit
                                        ? 'Edit Shift'
                                        : 'Assign Shift'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {modalData.is_bulk && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                                    <p className="font-semibold text-blue-800 mb-2">
                                        Assigning shifts to {bulkSelection.length} selected cells:
                                    </p>
                                    <ul className="text-blue-700 max-h-32 overflow-y-auto">
                                        {bulkSelection.map((sel, idx) => {
                                            const analyst = analysts.find(a => a.id === sel.analyst_id);
                                            return (
                                                <li key={idx} className="text-xs">
                                                    • {analyst?.first_name} {analyst?.last_name} on {sel.date_str}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            {!modalData.is_bulk && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Analyst
                                    </label>
                                    <input
                                        type="text"
                                        value={
                                            analysts.find((a) => a.id === modalData.analyst_id)
                                                ? `${analysts.find(
                                                    (a) => a.id === modalData.analyst_id
                                                ).first_name
                                                } ${analysts.find(
                                                    (a) => a.id === modalData.analyst_id
                                                ).last_name
                                                }`
                                                : ''
                                        }
                                        readOnly
                                        className="w-full border rounded px-3 py-2 bg-gray-100"
                                    />
                                </div>
                            )}

                            {!modalData.is_bulk && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={modalData.shift_date}
                                        readOnly
                                        className="w-full border rounded px-3 py-2 bg-gray-100"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Shift Type *
                                </label>
                                <select
                                    value={modalData.shift_type}
                                    onChange={(e) =>
                                        setModalData({
                                            ...modalData,
                                            shift_type: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded px-3 py-2"
                                    required
                                >
                                    {shiftTemplates.map((template) => (
                                        <option key={template.type} value={template.type}>
                                            {template.label} ({template.start_time} -{' '}
                                            {template.end_time})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {modalData.shift_type !== 'day_off' && modalData.shift_type !== 'approved_leave' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Work Location *
                                    </label>
                                    <select
                                        value={modalData.work_location}
                                        onChange={(e) =>
                                            setModalData({
                                                ...modalData,
                                                work_location: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    >
                                        <option value="office">🏢 Office</option>
                                        <option value="remote">🏠 Remote</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={modalData.notes}
                                    onChange={(e) =>
                                        setModalData({
                                            ...modalData,
                                            notes: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded px-3 py-2"
                                    rows="3"
                                    placeholder="Add any notes about this shift..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveShift}
                                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                    {modalData.is_edit ? 'Update' : 'Save'}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                {modalData.is_edit && (
                                    <button
                                        onClick={() => handleDeleteShift(modalData.shift_id)}
                                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
