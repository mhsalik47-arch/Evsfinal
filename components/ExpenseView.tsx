
import React, { useState, useMemo } from 'react';
import { Plus, X, ArrowDownRight, Tag, Filter, Pencil, Trash2, PieChart, Store, Search, UserPlus, ShoppingBag, User, Wallet } from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseSubCategory, PaymentMode, LabourPayment, LabourProfile, Vendor, Partner } from '../types';

interface ExpenseViewProps {
    expenses: Expense[];
    payments: LabourPayment[];
    labours: LabourProfile[];
    vendors: Vendor[];
    onAdd: (expense: Expense) => void;
    onUpdate: (expense: Expense) => void;
    onDelete: (id: string) => void;
    onDeletePayment: (id: string) => void;
    onAddVendor: (vendor: Vendor) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (id: string) => void;
    t: any;
}

const SUB_CATEGORIES: Record<string, string[]> = {
    Labour: ['Mistry', 'Majdoor', 'Plumber', 'Electrician', 'Painter', 'Carpenter'],
    Material: ['Cement', 'Saria', 'Sand/Bajri', 'Grit', 'Bricks', 'Tiles', 'Paint', 'Hardware', 'Electrical', 'Plumbing', 'Other Material'],
    Food: ['Tea/Snacks', 'Lunch', 'Dinner', 'Water', 'Other Food']
};

const CATEGORY_COLORS: Record<string, string> = {
    Material: 'bg-blue-100 text-blue-700',
    Labour: 'bg-amber-100 text-amber-700',
    Food: 'bg-emerald-100 text-emerald-700',
    Transport: 'bg-purple-100 text-purple-700',
    Utility: 'bg-indigo-100 text-indigo-700',
    Other: 'bg-slate-100 text-slate-700'
};

const ExpenseView: React.FC<ExpenseViewProps> = ({ expenses, payments, labours, vendors, onAdd, onUpdate, onDelete, onDeletePayment, onAddVendor, onUpdateVendor, onDeleteVendor, t }) => {
    const [view, setView] = useState<'expenses' | 'vendors'>('expenses');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [vendorSearch, setVendorSearch] = useState('');
    
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Material' as ExpenseCategory,
        subCategory: '' as ExpenseSubCategory,
        paidTo: '',
        paidBy: 'Project Balance' as Partner,
        vendorId: '',
        mode: 'Cash' as PaymentMode,
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [vendorFormData, setVendorFormData] = useState({
        name: '',
        category: 'Material' as ExpenseCategory,
        mobile: ''
    });

    const allTransactions = useMemo(() => {
        const mappedPayments: any[] = payments.map(p => ({
            id: p.id,
            amount: p.amount,
            date: p.date,
            category: 'Labour',
            subCategory: labours.find(l => String(l.id) === String(p.labourId))?.workType || 'Labour',
            paidTo: labours.find(l => String(l.id) === String(p.labourId))?.name || 'Labourer',
            paidBy: p.paidBy || 'Project Balance',
            mode: p.mode,
            notes: p.type, 
            isPayment: true,
            synced: true
        }));

        const mappedExpenses = expenses.map(e => {
            const vendor = vendors.find(v => v.id === e.vendorId);
            return {
                ...e,
                vendorName: vendor ? vendor.name : ''
            };
        });

        const combined = [...mappedExpenses, ...mappedPayments];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, payments, labours, vendors]);

    const filteredExpenses = useMemo(() => {
        let result = allTransactions;
        if (activeFilter !== 'All') {
            result = result.filter(e => e.category === activeFilter);
        }
        if (vendorSearch.trim()) {
            const search = vendorSearch.toLowerCase();
            result = result.filter(e => 
                e.paidTo.toLowerCase().includes(search) || 
                (e.vendorName && e.vendorName.toLowerCase().includes(search)) ||
                (e.notes && e.notes.toLowerCase().includes(search))
            );
        }
        return result;
    }, [allTransactions, activeFilter, vendorSearch]);

    const categoryTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    const availableVendors = useMemo(() => {
        return vendors.filter(v => v.category === formData.category);
    }, [vendors, formData.category]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ 
            amount: '', category: 'Material', subCategory: '', paidTo: '', paidBy: 'Project Balance', vendorId: '', mode: 'Cash', notes: '', date: new Date().toISOString().split('T')[0] 
        });
        setIsModalOpen(true);
    };

    const openEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData({
            amount: expense.amount.toString(),
            category: expense.category,
            subCategory: expense.subCategory || '',
            paidTo: expense.paidTo,
            paidBy: expense.paidBy || 'Project Balance',
            vendorId: expense.vendorId || '',
            mode: expense.mode,
            notes: expense.notes,
            date: expense.date
        });
        setIsModalOpen(true);
    };

    const handleVendorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vData: Vendor = {
            id: editingVendorId || Date.now().toString(),
            ...vendorFormData
        };
        if (editingVendorId) onUpdateVendor(vData);
        else onAddVendor(vData);
        setIsVendorModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalPaidTo = formData.paidTo;
        if (formData.vendorId) {
            const v = vendors.find(v => v.id === formData.vendorId);
            if (v) finalPaidTo = v.name;
        }

        const expenseData: Expense = {
            id: editingId || Date.now().toString(),
            amount: parseFloat(formData.amount),
            category: formData.category,
            subCategory: formData.subCategory,
            paidTo: finalPaidTo,
            paidBy: formData.paidBy,
            vendorId: formData.vendorId,
            mode: formData.mode,
            notes: formData.notes,
            date: formData.date,
            synced: true
        };
        if (editingId) onUpdate(expenseData);
        else onAdd(expenseData);
        setIsModalOpen(false);
    };

    const handleItemDelete = (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        if (window.confirm(t.confirmDelete)) {
            if (item.isPayment) onDeletePayment(item.id);
            else onDelete(item.id);
        }
    };

    const handleVendorDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm(t.confirmDelete)) {
            onDeleteVendor(id);
        }
    };

    const categories = ['All', 'Material', 'Labour', 'Food', 'Transport', 'Utility', 'Other'];

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-2">
                <button onClick={() => setView('expenses')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${view === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
                    {t.expense}
                </button>
                <button onClick={() => setView('vendors')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${view === 'vendors' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                    {t.vendors}
                </button>
            </div>

            {view === 'expenses' ? (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{t.expense}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction History</p>
                        </div>
                        <button onClick={openAdd} className="bg-rose-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setActiveFilter(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold border transition-all duration-300 ${activeFilter === cat ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                                    {cat === 'All' ? t.all : (t[cat.toLowerCase()] || cat)}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-rose-400">
                                <Search size={16} />
                            </div>
                            <input 
                                type="text"
                                placeholder={t.vendorSearch + "..."}
                                className="w-full pl-11 pr-4 py-3 bg-rose-50/30 border border-rose-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-200 transition-all font-bold placeholder:text-rose-300"
                                value={vendorSearch}
                                onChange={e => setVendorSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-[32px] text-white shadow-xl flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{activeFilter === 'All' ? 'TOTAL EXPENSE' : `${activeFilter.toUpperCase()} TOTAL`}</p>
                            <p className="text-2xl font-black">₹ {categoryTotal.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl relative z-10">
                            <PieChart size={24} className="text-rose-400" />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
                    </div>

                    <div className="space-y-3 pb-4">
                        {filteredExpenses.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400">
                                <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="font-bold text-sm">No transactions found</p>
                            </div>
                        ) : (
                            filteredExpenses.map(expense => (
                                <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group active:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                                            <ArrowDownRight size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800">₹ {expense.amount.toLocaleString()}</p>
                                                {expense.subCategory && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                                                        {t[expense.subCategory] || expense.subCategory}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-none mt-1">
                                                {expense.vendorName || expense.paidTo}
                                            </p>
                                            <p className="text-[9px] text-slate-300 font-medium mt-1 uppercase tracking-tighter">
                                                {expense.date} • <span className={`font-bold ${expense.paidBy === 'Project Balance' ? 'text-amber-600' : 'text-blue-600'}`}>{expense.paidBy}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${CATEGORY_COLORS[expense.category] || 'bg-slate-100 text-slate-500'}`}>
                                                {t[expense.category.toLowerCase()] || expense.category}
                                            </span>
                                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{expense.mode}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {!expense.isPayment && (
                                                <button onClick={() => openEdit(expense as Expense)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl active:scale-90"><Pencil size={14}/></button>
                                            )}
                                            <button onClick={(e) => handleItemDelete(e, expense)} className="p-2.5 text-rose-600 bg-rose-50 rounded-xl active:scale-90"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{t.vendors}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Shops & Suppliers</p>
                        </div>
                        <button onClick={() => { setEditingVendorId(null); setVendorFormData({name:'', category:'Material', mobile:''}); setIsVendorModalOpen(true); }} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
                            <UserPlus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {vendors.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400">
                                <Store size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="font-bold text-sm">No vendors saved yet</p>
                            </div>
                        ) : (
                            vendors.map(v => (
                                <div key={v.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                            <Store size={22} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-base">{v.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                    {t[v.category.toLowerCase()] || v.category}
                                                </span>
                                                {v.mobile && <span className="text-[10px] text-slate-400 font-bold">{v.mobile}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingVendorId(v.id); setVendorFormData({name:v.name, category:v.category, mobile:v.mobile||''}); setIsVendorModalOpen(true); }} className="p-3 text-blue-600 bg-blue-50 rounded-2xl active:scale-90"><Pencil size={16}/></button>
                                        <button onClick={(e) => handleVendorDelete(e, v.id)} className="p-3 text-rose-600 bg-rose-50 rounded-2xl active:scale-90"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 leading-tight">{editingId ? 'Edit Expense' : t.addExpense}</h3>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Transaction Details</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2.5 rounded-full active:scale-90">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                            <div className="text-center py-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Amount to Pay</label>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-black text-slate-300">₹</span>
                                    <input type="number" required autoFocus className="bg-transparent text-4xl font-black text-rose-600 outline-none w-48 text-center" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Paid From (पैसा कहाँ से खर्च हुआ?)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, paidBy: 'Project Balance'})}
                                        className={`p-4 rounded-2xl text-[11px] font-black transition-all border flex items-center justify-center gap-2 ${
                                            formData.paidBy === 'Project Balance' ? 'bg-amber-600 text-white border-amber-600 shadow-xl' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}
                                    >
                                        <Wallet size={16} /> Project Balance (जमा राशि में से)
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Master Mujahir', 'Dr. Salik'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({...formData, paidBy: p as Partner})}
                                                className={`p-4 rounded-2xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${
                                                    formData.paidBy === p ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                <User size={14} /> {p} (जेब से)
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mode</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value as PaymentMode})}>
                                        <option value="Cash">Cash (नकद)</option>
                                        <option value="Bank">Bank</option>
                                        <option value="UPI">UPI / PhonePe</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category & Sub-Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Material', 'Labour', 'Food', 'Transport', 'Utility', 'Other'].map(cat => (
                                        <button key={cat} type="button" onClick={() => setFormData({...formData, category: cat as ExpenseCategory, subCategory: '', vendorId: ''})} className={`p-3 rounded-2xl text-[10px] font-bold transition-all border ${formData.category === cat ? 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-100 scale-105' : 'bg-white text-slate-600 border-slate-200'}`}>
                                            {t[cat.toLowerCase()] || cat}
                                        </button>
                                    ))}
                                </div>
                                
                                {SUB_CATEGORIES[formData.category] && (
                                    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
                                        {SUB_CATEGORIES[formData.category].map(sub => (
                                            <button key={sub} type="button" onClick={() => setFormData({...formData, subCategory: sub})} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-bold transition-all border ${formData.subCategory === sub ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500'}`}>
                                                {t[sub] || sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Vendor</label>
                                    <button type="button" onClick={() => { setVendorFormData({...vendorFormData, category: formData.category}); setIsVendorModalOpen(true); }} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-1">
                                        <Plus size={12}/> {t.newVendor}
                                    </button>
                                </div>
                                <select 
                                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-rose-300 transition-colors" 
                                    value={formData.vendorId} 
                                    onChange={e => setFormData({...formData, vendorId: e.target.value})}
                                >
                                    <option value="">-- {t.selectVendor} --</option>
                                    {availableVendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Manual Name / Remarks</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium" placeholder="Or Enter Name Manually" value={formData.paidTo} onChange={e => setFormData({...formData, paidTo: e.target.value})} />
                                <textarea className="w-full p-4 mt-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm min-h-[80px]" placeholder="Specific notes about items purchased..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </div>

                            <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-rose-200 active:scale-95 transition-all uppercase tracking-widest">
                                {t.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Vendor modal remains same... */}
        </div>
    );
};

export default ExpenseView;
