
import React, { useState, useMemo } from 'react';
import { Users, Plus, X, Calendar, Wallet, UserPlus, Pencil, Trash2, CheckCheck, Clock, History, User } from 'lucide-react';
import { LabourProfile, Attendance, LabourPayment, AttendanceStatus, PaymentMode, Partner } from '../types';

interface LabourViewProps {
    labours: LabourProfile[];
    attendance: Attendance[];
    payments: LabourPayment[];
    onAddLabour: (l: LabourProfile) => void;
    onUpdateLabour: (l: LabourProfile) => void;
    onDeleteLabour: (id: string) => void;
    onAddAttendance: (a: Attendance) => void;
    onUpdateAttendance: (a: Attendance) => void;
    onDeleteAttendance: (id: string) => void;
    onAddPayment: (p: LabourPayment) => void;
    onUpdatePayment: (p: LabourPayment) => void;
    onDeletePayment: (id: string) => void;
    t: any;
}

const LabourView: React.FC<LabourViewProps> = ({ 
    labours, attendance, payments, 
    onAddLabour, onUpdateLabour, onDeleteLabour, 
    onAddAttendance, onUpdateAttendance, onDeleteAttendance, 
    onAddPayment, onUpdatePayment, onDeletePayment, 
    t 
}) => {
    const [view, setView] = useState<'profiles' | 'attendance' | 'payments'>('profiles');
    const [isAddingLabour, setIsAddingLabour] = useState(false);
    const [isEditingLabour, setIsEditingLabour] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<LabourProfile | null>(null);
    const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isBulkAttendance, setIsBulkAttendance] = useState(false);
    const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
    
    const [labourForm, setLabourForm] = useState({ id: '', name: '', mobile: '', workType: 'Mistry', dailyWage: '' });
    const [attForm, setAttForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'Present' as AttendanceStatus, overtime: '0' });
    const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Full Payment' as any, mode: 'Cash' as PaymentMode, paidBy: 'Project Balance' as Partner });

    const labourStats = useMemo(() => {
        return labours.map(l => {
            const att = attendance.filter(a => String(a.labourId) === String(l.id));
            const totalDays = att.reduce((acc, curr) => acc + (curr.status === 'Present' ? 1 : curr.status === 'Half-Day' ? 0.5 : 0), 0);
            const totalOTAmount = att.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
            const earnings = (totalDays * l.dailyWage) + totalOTAmount;
            const totalPaid = payments.filter(p => String(p.labourId) === String(l.id)).reduce((acc, curr) => acc + curr.amount, 0);
            return { ...l, totalDays, totalOTAmount, earnings, totalPaid, balance: earnings - totalPaid };
        });
    }, [labours, attendance, payments]);

    const sortedPayments = useMemo(() => {
        return [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const sortedAttendance = useMemo(() => {
        return [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance]);

    const getWorkerName = (id: string) => labours.find(l => String(l.id) === String(id))?.name || 'Unknown';

    const handleMarkAllPresent = () => {
        setSelectedWorkers(new Set(labours.map(l => l.id)));
        setIsBulkAttendance(true);
    };

    const handleBulkAttendanceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const today = attForm.date;
        selectedWorkers.forEach(id => {
            onAddAttendance({
                id: `att-${id}-${today}`,
                labourId: id,
                date: today,
                status: 'Present',
                overtimeHours: 0
            });
        });
        setIsBulkAttendance(false);
    };

    const toggleWorkerSelection = (id: string) => {
        const newSelection = new Set(selectedWorkers);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedWorkers(newSelection);
    };

    const handleEditAttendance = (a: Attendance) => {
        const labour = labours.find(l => String(l.id) === String(a.labourId));
        if (labour) {
            setSelectedLabour(labour);
            setAttForm({
                date: a.date,
                status: a.status,
                overtime: a.overtimeHours.toString()
            });
            setIsRecordingAttendance(true);
        }
    };

    const handleEditLabour = (l: LabourProfile) => {
        setLabourForm({
            id: l.id,
            name: l.name,
            mobile: l.mobile,
            workType: l.workType,
            dailyWage: l.dailyWage.toString()
        });
        setIsEditingLabour(true);
        setIsAddingLabour(true);
    };

    const handleAddLabourSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const labourData: LabourProfile = {
            id: isEditingLabour ? labourForm.id : Date.now().toString(),
            name: labourForm.name,
            mobile: labourForm.mobile,
            workType: labourForm.workType,
            dailyWage: parseFloat(labourForm.dailyWage) || 0
        };

        if (isEditingLabour) {
            onUpdateLabour(labourData);
        } else {
            onAddLabour(labourData);
        }
        
        setIsAddingLabour(false);
        setIsEditingLabour(false);
        setLabourForm({ id: '', name: '', mobile: '', workType: 'Mistry', dailyWage: '' });
    };

    return (
        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-0 z-40 backdrop-blur-md">
                {(['profiles', 'attendance', 'payments'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all relative ${view === v ? 'bg-white text-primary-blue shadow-sm' : 'text-slate-500'}`}>
                        {t[v] || v.toUpperCase()}
                        {v === 'attendance' && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[6px] px-1 rounded-full animate-pulse">NEW</span>
                        )}
                    </button>
                ))}
            </div>

            {view === 'profiles' && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-slate-800">{t.labour}</h2>
                        <button onClick={() => { setIsEditingLabour(false); setLabourForm({ id: '', name: '', mobile: '', workType: 'Mistry', dailyWage: '' }); setIsAddingLabour(true); }} className="primary-blue text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {labourStats.map(l => (
                            <div key={l.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 primary-blue rounded-xl flex items-center justify-center text-white font-bold text-lg uppercase">
                                            {l.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">{l.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold">{t[l.workType] || l.workType} • ₹{l.dailyWage}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditLabour(l)} className="p-2 text-blue-600 bg-blue-50 rounded-xl active:scale-90">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => { if(window.confirm(t.confirmDelete)) onDeleteLabour(l.id); }} className="p-2 text-rose-600 bg-rose-50 rounded-xl active:scale-90">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50">
                                    <div className="text-center">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{t.earned}</p>
                                        <p className="text-xs font-black text-slate-800">₹{l.earnings.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center border-x border-slate-50">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{t.totalPaid}</p>
                                        <p className="text-xs font-black text-emerald-600">₹{l.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">{t.balanceDue}</p>
                                        <p className="text-xs font-black text-rose-600">₹{l.balance.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => { setSelectedLabour(l); setAttForm({ date: new Date().toISOString().split('T')[0], status: 'Present', overtime: '0' }); setIsRecordingAttendance(true); }} className="bg-slate-50 text-slate-700 py-3 rounded-2xl text-[10px] font-bold border border-slate-100">Attendance</button>
                                    <button onClick={() => { setSelectedLabour(l); setPayForm({ amount: l.balance.toString(), date: new Date().toISOString().split('T')[0], type: 'Full Payment', mode: 'Cash', paidBy: 'Project Balance' }); setIsPaying(true); }} className="bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-bold shadow-lg shadow-blue-100">Pay Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'attendance' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">{t.attendance}</h2>
                        <button 
                            onClick={handleMarkAllPresent}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all"
                        >
                            <CheckCheck size={16} />
                            {t.markAllPresent}
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {sortedAttendance.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                                <History size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="font-bold text-sm">No attendance records</p>
                            </div>
                        ) : (
                            sortedAttendance.map(a => (
                                <div key={a.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                                            a.status === 'Present' ? 'bg-emerald-500' : a.status === 'Half-Day' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}>
                                            {a.status.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs">{getWorkerName(a.labourId)}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{a.date} {a.overtimeHours > 0 && `• OT: ₹${a.overtimeHours}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEditAttendance(a)}
                                            className="p-2 text-blue-600 bg-blue-50 rounded-lg active:scale-90"
                                        >
                                            <Pencil size={14}/>
                                        </button>
                                        <button 
                                            onClick={() => onDeleteAttendance(a.id)}
                                            className="p-2 text-rose-600 bg-rose-50 rounded-lg active:scale-90"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'payments' && (
                <div className="space-y-3">
                    {sortedPayments.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                            <Wallet size={40} className="mx-auto mb-2 opacity-20" />
                            <p className="font-bold text-sm">No payment records</p>
                        </div>
                    ) : (
                        sortedPayments.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <History size={18} className="text-blue-400" />
                                    <div>
                                        <p className="font-bold text-slate-800">₹ {p.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{getWorkerName(p.labourId)} • {p.date}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-tighter ${p.paidBy === 'Project Balance' ? 'text-amber-600' : 'text-blue-600'}`}>Paid From: {p.paidBy}</p>
                                    </div>
                                </div>
                                <button onClick={() => onDeletePayment(p.id)} className="text-rose-400 p-1"><Trash2 size={16}/></button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isAddingLabour && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{isEditingLabour ? 'Edit Labour' : 'Add New Labour'}</h3>
                            <button onClick={() => setIsAddingLabour(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <form className="space-y-5 pb-10" onSubmit={handleAddLabourSubmit}>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
                                <input type="text" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={labourForm.name} onChange={e => setLabourForm({...labourForm, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile</label>
                                <input type="tel" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={labourForm.mobile} onChange={e => setLabourForm({...labourForm, mobile: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Type</label>
                                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={labourForm.workType} onChange={e => setLabourForm({...labourForm, workType: e.target.value})}>
                                        {['Mistry', 'Majdoor', 'Plumber', 'Electrician', 'Painter', 'Carpenter'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Daily Wage</label>
                                    <input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={labourForm.dailyWage} onChange={e => setLabourForm({...labourForm, dailyWage: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary-blue text-white rounded-[24px] font-bold text-lg shadow-2xl active:scale-95 transition-all">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isRecordingAttendance && selectedLabour && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{selectedLabour.name} - {t.attendance}</h3>
                            <button onClick={() => setIsRecordingAttendance(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <form className="space-y-5 pb-10" onSubmit={e => {
                            e.preventDefault();
                            onAddAttendance({
                                id: `att-${selectedLabour.id}-${attForm.date}`,
                                labourId: selectedLabour.id,
                                date: attForm.date,
                                status: attForm.status,
                                overtimeHours: parseFloat(attForm.overtime) || 0
                            });
                            setIsRecordingAttendance(false);
                        }}>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                                <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={attForm.date} onChange={e => setAttForm({...attForm, date: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Present', 'Half-Day', 'Absent'] as AttendanceStatus[]).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setAttForm({...attForm, status: s})}
                                            className={`p-3 rounded-2xl text-[10px] font-bold transition-all border ${
                                                attForm.status === s 
                                                ? (s === 'Present' ? 'bg-emerald-600 text-white border-emerald-600' : s === 'Half-Day' ? 'bg-amber-600 text-white border-amber-600' : 'bg-rose-600 text-white border-rose-600')
                                                : 'bg-white text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {t[s] || s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Overtime Amount (ओवरटाइम के पैसे)</label>
                                <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={attForm.overtime} onChange={e => setAttForm({...attForm, overtime: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary-blue text-white rounded-[24px] font-bold text-lg shadow-2xl active:scale-95 transition-all">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isPaying && selectedLabour && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{selectedLabour.name} - {t.payments}</h3>
                            <button onClick={() => setIsPaying(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <form className="space-y-5 pb-10" onSubmit={e => {
                            e.preventDefault();
                            onAddPayment({ id: Date.now().toString(), labourId: selectedLabour.id, date: payForm.date, amount: parseFloat(payForm.amount), type: payForm.type, mode: payForm.mode, paidBy: payForm.paidBy });
                            setIsPaying(false);
                        }}>
                            <div className="text-center py-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount to Pay</span>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-black text-slate-300">₹</span>
                                    <input type="number" required autoFocus className="bg-transparent text-4xl font-black text-blue-600 outline-none w-48 text-center" placeholder="0" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Paid From (पैसा कहाँ से खर्च हुआ?)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPayForm({...payForm, paidBy: 'Project Balance'})}
                                        className={`p-4 rounded-2xl text-[11px] font-black transition-all border flex items-center justify-center gap-2 ${
                                            payForm.paidBy === 'Project Balance' ? 'bg-amber-600 text-white border-amber-600 shadow-xl' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}
                                    >
                                        <Wallet size={16} /> Project Balance (जमा राशि में से)
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Master Mujahir', 'Dr. Salik'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPayForm({...payForm, paidBy: p as Partner})}
                                                className={`p-4 rounded-2xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${
                                                    payForm.paidBy === p ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                <User size={14} /> {p} (जेब से)
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} />
                                <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={payForm.mode} onChange={e => setPayForm({...payForm, mode: e.target.value as PaymentMode})}>
                                    <option value="Cash">Cash (नकद)</option>
                                    <option value="UPI">UPI / PhonePe</option>
                                    <option value="Bank">Bank Transfer</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-bold text-lg shadow-2xl active:scale-95 transition-all">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isBulkAttendance && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{t.markAllPresent}</h3>
                            <button onClick={() => setIsBulkAttendance(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <form className="space-y-5 pb-10" onSubmit={handleBulkAttendanceSubmit}>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t.date}</label>
                                <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={attForm.date} onChange={e => setAttForm({...attForm, date: e.target.value})} />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t.labour}</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                                    {labours.map(l => (
                                        <div 
                                            key={l.id} 
                                            onClick={() => toggleWorkerSelection(l.id)}
                                            className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer transition-all ${
                                                selectedWorkers.has(l.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                                                    selectedWorkers.has(l.id) ? 'bg-emerald-500' : 'bg-slate-200'
                                                }`}>
                                                    {l.name.charAt(0)}
                                                </div>
                                                <span className={`text-sm font-bold ${selectedWorkers.has(l.id) ? 'text-emerald-900' : 'text-slate-600'}`}>{l.name}</span>
                                            </div>
                                            {selectedWorkers.has(l.id) && <CheckCheck size={16} className="text-emerald-600" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold text-lg shadow-2xl active:scale-95 transition-all">
                                {t.save} ({selectedWorkers.size})
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabourView;
