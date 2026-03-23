import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Copy,
    Loader,
    X,
} from 'lucide-react';
import { analystAPI, shiftAPI } from '../api';
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function ShiftCalendar() {
    const { user, hasRole } = useAuth();
    const canEdit = hasRole('admin', 'soc_manager', 'shift_coordinator');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [analysts, setAnalysts] = useState([]);
    const [shifts, setShifts] = useState([]);
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
        is_edit: false,
        shift_id: null,
        is_bulk: false,
    });

    // Quick assign mode - select analyst once, click multiple cells
    const [quickAssignMode, setQuickAssignMode] = useState(false);
    const [selectedAnalyst, setSelectedAnalyst] = useState(null);
    const [selectedWorkLocation, setSelectedWorkLocation] = useState('office');

    // Bulk assignment mode
    const [bulkMode, setBulkMode] = useState(null);
    const [bulkSelection, setBulkSelection] = useState([]);

    // Copy/paste mode
    const [copiedShift, setCopiedShift] = useState(null);

    // Drag to fill
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartCell, setDragStartCell] = useState(null);

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

    const getAnalystsForShiftTypeAndDate = (shiftType, dateStr) => {
        return shifts.filter(
            (s) => s.shift_type === shiftType && s.shift_date === dateStr
        );
    };

    const getShiftForAnalystOnDate = (analystId, dateStr) => {
        return shifts.find(
            (s) => s.analyst_id === analystId && s.shift_date === dateStr
        );
    };

    const getAnalystInitials = (analystId) => {
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return '?';
        const firstInitial = analyst.first_name?.charAt(0) || '';
        const lastInitial = analyst.last_name?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    const openModal = (shiftType, dateStr, existingShift = null) => {
        setModalData({
            analyst_id: existingShift?.analyst_id || null,
            shift_date: dateStr,
            shift_type: shiftType,
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
                        work_location: modalData.work_location || 'office',
                    })
                );
                await Promise.all(promises);
                setBulkMode(null);
                setBulkSelection([]);
            } else if (modalData.is_edit && modalData.shift_id) {
                await shiftAPI.update(modalData.shift_id, {
                    shift_date: modalData.shift_date,
                    shift_type: modalData.shift_type,
                    notes: modalData.notes,
                    work_location: modalData.work_location || 'office',
                });
            } else {
                await shiftAPI.create({
                    analyst_id: modalData.analyst_id,
                    shift_date: modalData.shift_date,
                    shift_type: modalData.shift_type,
                    notes: modalData.notes,
                    work_location: modalData.work_location || 'office',
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
        } catch (err) {
            setError('Failed to delete shift');
        }
    };

    // Quick assign: Click cell to instantly assign selected analyst
    const handleQuickAssign = async (shiftType, dateStr) => {
        if (!selectedAnalyst) return;

        try {
            await shiftAPI.create({
                analyst_id: selectedAnalyst.id,
                shift_date: dateStr,
                shift_type: shiftType,
                notes: '',
                work_location: selectedWorkLocation,
            });
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign shift');
        }
    };

    // Copy shift pattern
    const handleCopyShift = (shift) => {
        setCopiedShift({
            analyst_id: shift.analyst_id,
            shift_type: shift.shift_type,
            work_location: shift.work_location,
            notes: shift.notes,
        });
    };

    // Paste shift to new date
    const handlePasteShift = async (shiftType, dateStr) => {
        if (!copiedShift) return;

        try {
            await shiftAPI.create({
                ...copiedShift,
                shift_date: dateStr,
                shift_type: shiftType,
            });
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to paste shift');
        }
    };

    // Handle drag start for drag-to-fill
    const handleDragStart = (shiftType, dateStr, analyst) => {
        setIsDragging(true);
        setDragStartCell({ shiftType, dateStr, analyst });
    };

    // Handle drag over cells
    const handleDragOver = (e, shiftType, dateStr) => {
        e.preventDefault();
        if (isDragging && dragStartCell) {
            // Visual feedback could be added here
        }
    };

    // Handle drop to fill range
    const handleDrop = async (e, shiftType, dateStr) => {
        e.preventDefault();
        if (!isDragging || !dragStartCell || !dragStartCell.analyst) return;

        try {
            await shiftAPI.create({
                analyst_id: dragStartCell.analyst.analyst_id,
                shift_date: dateStr,
                shift_type: shiftType,
                work_location: dragStartCell.analyst.work_location || 'office',
                notes: '',
            });
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign shift');
        }

        setIsDragging(false);
        setDragStartCell(null);
    };

    const handleBulkAssign = async () => {
        if (bulkSelection.length === 0) {
            setError('Please select at least one cell');
            return;
        }

        // Open modal for bulk assignment
        setModalData({
            analyst_id: null, // null means bulk
            shift_date: '',
            shift_type: 'morning',
            notes: '',
            is_edit: false,
            shift_id: null,
            is_bulk: true,
        });
        setShowModal(true);
    };

    const handleBulkSwap = async () => {
        if (bulkSelection.length !== 2) {
            setError('Please select exactly 2 shifts to swap');
            return;
        }

        try {
            const [shift1, shift2] = bulkSelection;
            const shiftData1 = getShiftForAnalystOnDate(shift1.analyst_id, shift1.date_str);
            const shiftData2 = getShiftForAnalystOnDate(shift2.analyst_id, shift2.date_str);

            if (!shiftData1 || !shiftData2) {
                setError('Both cells must have existing shifts to swap');
                return;
            }

            // Swap the shifts by updating each one
            await Promise.all([
                shiftAPI.update(shiftData1.id, {
                    analyst_id: shift2.analyst_id,
                    shift_date: shift2.date_str,
                    shift_type: shiftData1.shift_type,
                    notes: shiftData1.notes,
                    work_location: shiftData1.work_location || 'office',
                }),
                shiftAPI.update(shiftData2.id, {
                    analyst_id: shift1.analyst_id,
                    shift_date: shift1.date_str,
                    shift_type: shiftData2.shift_type,
                    notes: shiftData2.notes,
                    work_location: shiftData2.work_location || 'office',
                }),
            ]);

            await fetchData();
            setBulkMode(null);
            setBulkSelection([]);
            setError(null);
        } catch (err) {
            setError('Failed to swap shifts: ' + (err.response?.data?.error || err.message));
            console.error(err);
        }
    };

    const toggleBulkSelection = (analystId, dateStr) => {
        const key = `${analystId}-${dateStr}`;
        const shift = getShiftForAnalystOnDate(analystId, dateStr);

        // For 'assign' mode, don't allow selecting cells that already have shifts
        // For 'swap' mode, ONLY allow selecting cells with existing shifts
        if (bulkMode === 'assign' && shift) {
            setError('Cannot select cells with existing shifts for bulk assign');
            return;
        }

        if (bulkMode === 'swap' && !shift) {
            setError('Can only select cells with existing shifts for swap');
            return;
        }

        setBulkSelection((prev) => {
            const isSelected = prev.some((s) => s.key === key);
            if (isSelected) {
                return prev.filter((s) => s.key !== key);
            } else {
                return [
                    ...prev,
                    { key, analyst_id: analystId, date_str: dateStr, shift_id: shift?.id },
                ];
            }
        });
    };

    const getShiftTypeLabel = (type) => {
        const labels = {
            'morning': 'M',
            'evening': 'E',
            'night': 'N',
            'standard': 'S',
            'day_off': 'DO',
            'approved_leave': 'AL'
        };
        return labels[type] || '?';
    };

    const getShiftColor = (shift) => {
        if (!shift) return 'bg-gray-50 border-gray-200';

        // Color based on shift type
        switch (shift.shift_type) {
            case 'morning':
                return 'bg-cyan-100 border-cyan-300';
            case 'evening':
                return 'bg-purple-100 border-purple-300';
            case 'night':
                return 'bg-violet-200 border-violet-400';
            case 'standard':
                return 'bg-green-100 border-green-300';
            case 'day_off':
                return 'bg-gray-200 border-gray-400';
            case 'approved_leave':
                return 'bg-yellow-100 border-yellow-400';
            default:
                return 'bg-gray-100 border-gray-300';
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
        <div className="container mx-auto p-6">
            {!canEdit && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-3">
                    <strong>📖 Read-Only Mode:</strong> You can view the calendar but cannot create or edit shifts.
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Shift Calendar</h1>
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
                </div>
            </div>

            {/* Quick Assign Panel - Compact */}
            {canEdit && (
                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="font-semibold text-sm text-blue-900">⚡ Quick Assign:</div>
                        <div className="flex gap-2 flex-1">
                            {analysts.map((analyst, index) => (
                                <button
                                    key={analyst.id}
                                    onClick={() => {
                                        setSelectedAnalyst(analyst);
                                        setQuickAssignMode(true);
                                    }}
                                    className={`px-3 py-1.5 rounded border transition-all text-xs font-semibold ${selectedAnalyst?.id === analyst.id
                                        ? 'bg-blue-500 text-white border-blue-600 shadow'
                                        : 'bg-white hover:bg-blue-50 border-gray-300'
                                        }`}
                                    title={`${analyst.first_name} ${analyst.last_name}`}
                                >
                                    {index + 1}. {getAnalystInitials(analyst.id)}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedWorkLocation('office')}
                                className={`px-3 py-1.5 rounded border text-xs ${selectedWorkLocation === 'office'
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                🏢
                            </button>
                            <button
                                onClick={() => setSelectedWorkLocation('remote')}
                                className={`px-3 py-1.5 rounded border text-xs ${selectedWorkLocation === 'remote'
                                    ? 'bg-purple-500 text-white border-purple-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                🏠
                            </button>
                        </div>
                        {quickAssignMode && selectedAnalyst && (
                            <button
                                onClick={() => {
                                    setQuickAssignMode(false);
                                    setSelectedAnalyst(null);
                                }}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {quickAssignMode && selectedAnalyst && (
                        <div className="mt-2 text-xs text-green-800 bg-green-50 rounded px-3 py-1.5 border border-green-300">
                            <strong>✓ Active:</strong> Click cells to assign {selectedAnalyst.first_name} ({selectedWorkLocation === 'office' ? '🏢 Office' : '🏠 Remote'})
                            {copiedShift && <span className="ml-3 text-blue-700">| 📋 Right-click to paste copied shift</span>}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-4 text-red-700 hover:text-red-900"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Calendar Table */}
            <div className="mb-2 text-center">
                <h2 className="text-xl font-semibold text-gray-700">{monthLabel}</h2>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                            <th className="border p-1.5 text-left font-semibold sticky left-0 bg-blue-500 z-10 w-24">
                                Shift Type
                            </th>
                            {days.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const holiday = greekHolidays[dateStr];
                                const dayOfWeek = day.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                return (
                                    <th
                                        key={day.toISOString()}
                                        className={`border p-1 text-center font-semibold w-16 ${holiday ? 'bg-red-600' : isWeekend ? 'bg-blue-600' : ''
                                            }`}
                                        title={holiday || ''}
                                    >
                                        <div className="text-xs">{format(day, 'EEE')}</div>
                                        <div className="text-[10px]">{format(day, 'dd')}</div>
                                        {holiday && (
                                            <div className="text-[9px] font-normal">🇬🇷</div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {shiftTemplates.map((template) => (
                            <tr key={template.type} className="hover:bg-gray-50">
                                <td className={`border p-1.5 font-semibold sticky left-0 z-10 ${getShiftColor({ shift_type: template.type })}`}>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs">{getShiftTypeLabel(template.type)}</span>
                                        <span className="text-[10px] text-gray-600">{template.label}</span>
                                    </div>
                                </td>
                                {days.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const analystShifts = getAnalystsForShiftTypeAndDate(template.type, dateStr);

                                    return (
                                        <td
                                            key={`${template.type}-${dateStr}`}
                                            className={`border p-1 text-center ${canEdit ? 'cursor-pointer' : 'cursor-default'} transition-all ${canEdit && quickAssignMode && selectedAnalyst ? 'hover:bg-green-100 hover:border-green-400' : canEdit ? 'hover:bg-gray-100' : ''}
                                                }`}
                                            onClick={(e) => {
                                                if (!canEdit) return; if (!canEdit) return; if (quickAssignMode && selectedAnalyst) {
                                                    handleQuickAssign(template.type, dateStr);
                                                } else {
                                                    openModal(template.type, dateStr);
                                                }
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (copiedShift) {
                                                    handlePasteShift(template.type, dateStr);
                                                }
                                            }}
                                            onDragOver={(e) => handleDragOver(e, template.type, dateStr)}
                                            onDrop={(e) => handleDrop(e, template.type, dateStr)}
                                        >
                                            <div className="flex flex-wrap gap-1 justify-center items-center">
                                                {analystShifts.length > 0 ? (
                                                    analystShifts.map((shift) => {
                                                        const analyst = analysts.find(a => a.id === shift.analyst_id);
                                                        return (
                                                            <div
                                                                key={shift.id}
                                                                className="group relative inline-block"
                                                                draggable
                                                                onDragStart={() => handleDragStart(template.type, dateStr, shift)}
                                                            >
                                                                <div
                                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${shift.work_location === 'remote'
                                                                        ? 'bg-purple-500 text-white'
                                                                        : 'bg-blue-500 text-white'
                                                                        } hover:scale-110 transition-transform cursor-move`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (canEdit) openModal(template.type, dateStr, shift);
                                                                    }}
                                                                    onContextMenu={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        handleCopyShift(shift);
                                                                    }}
                                                                    title={`${analyst?.first_name} ${analyst?.last_name}${shift.work_location === 'remote' ? ' (Remote)' : ''}\nDrag to copy | Right-click to copy | Click to edit`}
                                                                >
                                                                    {getAnalystInitials(shift.analyst_id)}
                                                                </div>
                                                                {/* Hover tooltip */}
                                                                <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs p-2 rounded bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                                                                    <div className="font-semibold">{analyst?.first_name} {analyst?.last_name}</div>
                                                                    <div className="text-[10px]">{shift.work_location === 'remote' ? '🏠 Remote' : '🏢 Office'}</div>
                                                                    {shift.notes && (
                                                                        <div className="text-[10px] mt-1 border-t pt-1">{shift.notes}</div>
                                                                    )}
                                                                    <div className="text-[10px] text-yellow-400 mt-1">
                                                                        Left-click: Edit | Right-click: Copy | Drag: Clone
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <button className="text-gray-400 hover:text-gray-600 text-lg w-full h-full">
                                                        {quickAssignMode && selectedAnalyst ? '⚡' : '+'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legends at Bottom */}
            <div className="mt-4 p-3 bg-white rounded-lg shadow border">
                <h3 className="font-semibold mb-2 text-sm text-gray-700">Legend</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <h4 className="font-semibold mb-1.5 text-xs text-gray-600">Badge Colors:</h4>
                        <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px] font-bold">JD</span>
                                <span>Office</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded text-[10px] font-bold">JD</span>
                                <span>Remote (🏠)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1.5 text-xs text-gray-600">Shift Type Colors:</h4>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-cyan-100 border border-cyan-300 rounded"></span>
                                <span className="text-[10px]">M</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></span>
                                <span className="text-[10px]">E</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-violet-200 border border-violet-400 rounded"></span>
                                <span className="text-[10px]">N</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                                <span className="text-[10px]">S</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></span>
                                <span className="text-[10px]">DO</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></span>
                                <span className="text-[10px]">AL</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-2 bg-blue-50 rounded text-[10px] text-gray-700 border border-blue-200">
                    <div className="font-bold text-xs mb-1 text-blue-900">⚡ Quick Tips:</div>
                    <div className="grid grid-cols-2 gap-x-3">
                        <span>• <strong>Quick Mode:</strong> Select analyst, click cells</span>
                        <span>• <strong>Drag:</strong> Clone shifts to other cells</span>
                        <span>• <strong>Copy/Paste:</strong> Right-click badge → Right-click cell</span>
                        <span>• <strong>Edit:</strong> Left-click any badge</span>
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
                                        {bulkSelection.map((sel) => {
                                            const analyst = analysts.find(
                                                (a) => a.id === sel.analyst_id
                                            );
                                            return (
                                                <li key={sel.key} className="text-xs">
                                                    • {analyst?.first_name}{' '}
                                                    {analyst?.last_name} on {sel.date_str}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {!modalData.is_bulk && (
                                <>
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

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">
                                            Shift Type
                                        </label>
                                        <input
                                            type="text"
                                            value={shiftTemplates.find(t => t.type === modalData.shift_type)?.label || modalData.shift_type}
                                            readOnly
                                            className="w-full border rounded px-3 py-2 bg-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">
                                            Analyst *
                                        </label>
                                        <select
                                            value={modalData.analyst_id || ''}
                                            onChange={(e) =>
                                                setModalData({
                                                    ...modalData,
                                                    analyst_id: parseInt(e.target.value),
                                                })
                                            }
                                            className="w-full border rounded px-3 py-2"
                                            required
                                        >
                                            <option value="">Select Analyst</option>
                                            {analysts.map((analyst) => (
                                                <option key={analyst.id} value={analyst.id}>
                                                    {analyst.first_name} {analyst.last_name} ({getAnalystInitials(analyst.id)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {modalData.shift_type !== 'day_off' && modalData.shift_type !== 'approved_leave' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Work Location *
                                    </label>
                                    <select
                                        value={modalData.work_location || 'office'}
                                        onChange={(e) =>
                                            setModalData({
                                                ...modalData,
                                                work_location: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    >
                                        <option value="office">Office</option>
                                        <option value="remote">Remote</option>
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
                                    placeholder="Add any notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveShift}
                                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    {modalData.is_bulk
                                        ? `Assign ${bulkSelection.length} Shifts`
                                        : 'Save'}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                {modalData.is_edit && !modalData.is_bulk && (
                                    <button
                                        onClick={() => {
                                            handleDeleteShift(modalData.shift_id);
                                            closeModal();
                                        }}
                                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
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
