
import React, { useState, useMemo } from 'react';
import { Plus, X, ArrowUpRight, Search, Pencil, Trash2, Wallet, User, Info, Filter, TrendingUp, HandCoins } from 'lucide-react';
import { Income, IncomeSource, Partner, PaymentMode, Expense, LabourPayment } from '../types';

interface IncomeViewProps {
    incomes: Income[];
    expenses?: Expense[]; // Optional for showing personal spending
    payments?: LabourPayment[]; // Optional for showing personal spending
    onAdd: (income: Income) => void;
    onUpdate: (income: Income) => void;
    onDelete: (id: string) => void;
    t: any;
}

const IncomeView: React.FC<IncomeViewProps> = ({ 
    incomes, 
    expenses = [], 
    payments = [], 
    onAdd, 
    onUpdate, 
    onDelete, 
    t 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        amount: '',
        source: 'Investment' as IncomeSource,
        paidBy: 'Master Mujahir' as Partner,
        mode: 'Cash' as PaymentMode,
        remarks: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Merged History: Direct Income + Partner Spending
    const mergedHistory = useMemo(() => {
        const direct = incomes.map(i => ({
            ...i,
            type: 'direct',
            label: 'Direct Fund'
        }));

        // Filter expenses paid by partners personally
        const personalExpenses = expenses
            .filter(e => e.paidBy === 'Master Mujahir' || e.paidBy === 'Dr. Salik')
            .map(e => ({
                id: e.id,
                amount: e.amount,
                date: e.date,
                source: 'Out-of-pocket' as any,
                paidBy: e.paidBy,
                mode: e.mode,
                remarks: `Spent on: ${e.paidTo} (${e.category})`,
                type: 'spent_expense',
                label: 'Personal Spend'
            }));

        // Filter labour payments paid by partners personally
        const personalPayments = payments
            .filter(p => p.paidBy === 'Master Mujahir' || p.paidBy === 'Dr. Salik')
            .map(p => ({
                id: p.id,
                amount: p.amount,
                date: p.date,
                source: 'Out-of-pocket' as any,
                paidBy: p.paidBy,
                mode: p.mode,
                remarks: `Labour Payment (${p.type})`,
                type: 'spent_labour',
                label: 'Personal Spend'
            }));

        return [...direct, ...personalExpenses, ...personalPayments]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incomes, expenses, payments]);

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return mergedHistory;
        const s = searchTerm.toLowerCase();
        return mergedHistory.filter(h => 
            h.paidBy.toLowerCase().includes(s) || 
            h.remarks.toLowerCase().includes(s) ||
            h.amount.toString().includes(s)
        );
    }, [mergedHistory, searchTerm]);

    const stats = useMemo(() => {
        const directTotal = incomes.reduce((s, i) => s + i.amount, 0);
        const spentTotal = mergedHistory
            .filter(h => h.type !== 'direct')
            .reduce((s, h) => s + h.amount, 0);
        return { directTotal, spentTotal };
    }, [incomes, mergedHistory]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ 
            amount: '', source: 'Investment', paidBy: 'Master Mujahir', mode: 'Cash', remarks: '', date: new Date().toISOString().split('T')[0] 
        });
        setIsModalOpen(true);
    };

    const openEdit = (income: any) => {
        if (income.type !== 'direct') {
            alert("Note: This transaction was recorded via Expenses/Labour and must be edited there.");
            return;
        }
        setEditingId(income.id);
        setFormData({
            amount: income.amount.toString(),
            source: income.source,
            paidBy: income.paidBy,
            mode: income.mode,
            remarks: income.remarks || '',
            date: income.date
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                alert("Please enter a valid amount");
                return;
            }

            const incomeData: Income = {
                id: editingId || `inc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                amount,
                source: formData.source,
                paidBy: formData.paidBy,
                mode: formData.mode,
                remarks: formData.remarks,
                date: formData.date,
                synced: true
            };

            if (editingId) onUpdate(incomeData);
            else onAdd(incomeData);

            setIsModalOpen(false);
        } catch (error) {
            console.error("Submit Error:", error);
            alert("Error saving transaction");
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string, type: string) => {
        e.stopPropagation();
        if (type !== 'direct') {
            alert("Please delete personal spending from the Expenses/Labour tab.");
            return;
        }
        if (window.confirm(t.confirmDelete)) {
            onDelete(id);
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t.income}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inflow & Contributions</p>
                </div>
                <button 
                    onClick={openAdd}
                    className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                    <div className="bg-emerald-50 w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
                        <Wallet size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">Direct Fund</p>
                    <p className="text-sm font-black text-emerald-600 tracking-tight">₹ {stats.directTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                    <div className="bg-blue-50 w-8 h-8 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                        <HandCoins size={16} />
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">Partner Spend</p>
                    <p className="text-sm font-black text-blue-600 tracking-tight">₹ {stats.spentTotal.toLocaleString()}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-emerald-300"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* History List */}
            <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400">
                        <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">{t.noRecords}</p>
                    </div>
                ) : (
                    filteredHistory.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => openEdit(item)}
                            className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${item.type === 'direct' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {item.type === 'direct' ? <ArrowUpRight size={20} /> : <HandCoins size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800">₹ {item.amount.toLocaleString()}</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${item.type === 'direct' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold leading-none mt-1">
                                        {item.paidBy} • {item.date}
                                    </p>
                                    {item.remarks && (
                                        <p className="text-[9px] text-slate-400 mt-1 line-clamp-1 italic">"{item.remarks}"</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right mr-1">
                                    <span className="text-[8px] font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 uppercase tracking-widest">{item.mode}</span>
                                </div>
                                {item.type === 'direct' && (
                                    <button 
                                        onClick={(e) => handleDelete(e, item.id, item.type)} 
                                        className="p-2.5 text-rose-400 bg-rose-50 rounded-xl active:scale-90"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[40px] p-8 overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Entry' : t.addIncome}</h3>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Cash / Bank Injections</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2.5 rounded-full active:scale-90">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                            <div className="text-center py-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                                <label className="block text-xs font-bold text-emerald-600/60 uppercase mb-2 tracking-widest">Amount to Add (रकम)</label>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-black text-emerald-200">₹</span>
                                    <input 
                                        type="number" 
                                        required 
                                        autoFocus 
                                        className="bg-transparent text-5xl font-black text-emerald-600 outline-none w-56 text-center placeholder:text-emerald-100" 
                                        placeholder="0" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Mode</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value as PaymentMode})}>
                                        <option value="Cash">Cash (नकद)</option>
                                        <option value="Bank">Bank Transfer</option>
                                        <option value="UPI">UPI / PhonePe</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Deposited By (किसने पैसा जमा किया?)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Master Mujahir', 'Dr. Salik'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({...formData, paidBy: p as Partner})}
                                            className={`p-4 rounded-2xl text-[11px] font-black transition-all border flex items-center justify-center gap-2 ${
                                                formData.paidBy === p ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <User size={14} /> {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Source (पैसा कहाँ से आया?)</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800"
                                    value={formData.source}
                                    onChange={e => setFormData({...formData, source: e.target.value as IncomeSource})}
                                >
                                    <option value="Investment">Investment (अपना निवेश)</option>
                                    <option value="Loan">Loan (उधार/कर्ज)</option>
                                    <option value="Donation">Donation (दान/सहयोग)</option>
                                    <option value="Other">Other (अन्य)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Remarks / Note (विवरण)</label>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold min-h-[100px] placeholder:text-slate-300" 
                                    placeholder="Enter additional details here..." 
                                    value={formData.remarks} 
                                    onChange={e => setFormData({...formData, remarks: e.target.value})} 
                                />
                            </div>

                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-emerald-200 active:scale-95 transition-all uppercase tracking-[0.2em]">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeView;
