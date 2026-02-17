
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
    const [selectedLabour, setSelectedLabour] = useState<LabourProfile | null>(null);
    const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    
    const [labourForm, setLabourForm] = useState({ name: '', mobile: '', workType: 'Mistry', dailyWage: '' });
    const [attForm, setAttForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'Present' as AttendanceStatus, overtime: '0' });
    const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Full Payment' as any, mode: 'Cash' as PaymentMode, paidBy: 'Project Balance' as Partner });

    const labourStats = useMemo(() => {
        return labours.map(l => {
            const att = attendance.filter(a => String(a.labourId) === String(l.id));
            const totalDays = att.reduce((acc, curr) => acc + (curr.status === 'Present' ? 1 : curr.status === 'Half-Day' ? 0.5 : 0), 0);
            const totalOT = att.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
            const earnings = (totalDays * l.dailyWage) + (totalOT * (l.dailyWage / 8));
            const totalPaid = payments.filter(p => String(p.labourId) === String(l.id)).reduce((acc, curr) => acc + curr.amount, 0);
            return { ...l, totalDays, totalOT, earnings, totalPaid, balance: earnings - totalPaid };
        });
    }, [labours, attendance, payments]);

    const sortedPayments = useMemo(() => {
        return [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const getWorkerName = (id: string) => labours.find(l => String(l.id) === String(id))?.name || 'Unknown';

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header and Nav Buttons remain same... */}
            <div className="flex bg-slate-200/50 p-1 rounded-2xl sticky top-16 z-40 backdrop-blur-md">
                {(['profiles', 'attendance', 'payments'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${view === v ? 'bg-white text-primary-blue shadow-sm' : 'text-slate-500'}`}>
                        {t[v] || v.toUpperCase()}
                    </button>
                ))}
            </div>

            {view === 'profiles' && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-slate-800">{t.labour}</h2>
                        <button onClick={() => setIsAddingLabour(true)} className="primary-blue text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
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
                                    <div className="text-right">
                                        <p className="text-[8px] font-bold text-rose-500 uppercase">Balance</p>
                                        <p className="text-base font-black text-slate-900">₹ {l.balance.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => { setSelectedLabour(l); setIsRecordingAttendance(true); }} className="bg-slate-50 text-slate-700 py-3 rounded-2xl text-[10px] font-bold border border-slate-100">Attendance</button>
                                    <button onClick={() => { setSelectedLabour(l); setIsPaying(true); }} className="bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-bold shadow-lg shadow-blue-100">Pay Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'payments' && (
                <div className="space-y-3">
                    {sortedPayments.map(p => (
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
                    ))}
                </div>
            )}

            {/* Attendance modal same... */}

            {isPaying && selectedLabour && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{selectedLabour.name} - {t.payments}</h3>
                            <button onClick={() => setIsPaying(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
                        </div>
                        <form className="space-y-5 pb-6" onSubmit={e => {
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

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg uppercase shadow-2xl active:scale-95 transition-all">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabourView;
