
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { IndianRupee, Wallet, ArrowUpCircle, ArrowDownCircle, HardHat, AlertCircle, Banknote, ShieldCheck, User } from 'lucide-react';
import { Income, Expense, LabourProfile, Attendance, LabourPayment, AppSettings } from '../types';

interface DashboardViewProps {
    incomes: Income[];
    expenses: Expense[];
    labours: LabourProfile[];
    attendance: Attendance[];
    payments: LabourPayment[];
    t: any;
    settings: AppSettings;
}

const DashboardView: React.FC<DashboardViewProps> = ({ incomes, expenses, labours, attendance, payments, t, settings }) => {
    
    // Detailed Partner Statistics Calculation
    const partnerStatsBreakdown = useMemo(() => {
        const calculateForPartner = (name: string) => {
            // 1. Direct Income injections
            const directIncome = incomes
                .filter(i => i.paidBy === name)
                .reduce((sum, i) => sum + i.amount, 0);
            
            // 2. Out of pocket expenses
            const oopExpenses = expenses
                .filter(e => e.paidBy === name)
                .reduce((sum, e) => sum + e.amount, 0);
            
            // 3. Out of pocket labour payments
            const oopPayments = payments
                .filter(p => p.paidBy === name)
                .reduce((sum, p) => sum + p.amount, 0);

            return {
                name,
                direct: directIncome,
                spent: oopExpenses + oopPayments,
                total: directIncome + oopExpenses + oopPayments
            };
        };

        return {
            mujahir: calculateForPartner('Master Mujahir'),
            salik: calculateForPartner('Dr. Salik')
        };
    }, [incomes, expenses, payments]);

    const totalIncome = useMemo(() => {
        const directIncomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
        
        // Include everything paid by partners that wasn't a direct income record
        const oopExpenses = expenses
            .filter(e => e.paidBy === 'Master Mujahir' || e.paidBy === 'Dr. Salik')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const oopPayments = payments
            .filter(p => p.paidBy === 'Master Mujahir' || p.paidBy === 'Dr. Salik')
            .reduce((sum, p) => sum + p.amount, 0);

        return directIncomeTotal + oopExpenses + oopPayments;
    }, [incomes, expenses, payments]);
    
    const labourStats = useMemo(() => {
        let earningsTotal = 0;
        let paymentsTotal = 0;

        labours.forEach(l => {
            const att = attendance.filter(a => String(a.labourId) === String(l.id));
            const totalDays = att.reduce((acc, curr) => acc + (curr.status === 'Present' ? 1 : curr.status === 'Half-Day' ? 0.5 : 0), 0);
            const totalOT = att.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
            const earned = (totalDays * l.dailyWage) + (totalOT * (l.dailyWage / 8));
            
            const paid = payments.filter(p => String(p.labourId) === String(l.id)).reduce((acc, curr) => acc + curr.amount, 0);
            
            earningsTotal += earned;
            paymentsTotal += paid;
        });

        return { earningsTotal, paymentsTotal, outstanding: earningsTotal - paymentsTotal };
    }, [labours, attendance, payments]);

    const totalExpense = useMemo(() => {
        const directExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        return directExpenses + labourStats.paymentsTotal;
    }, [expenses, labourStats.paymentsTotal]);

    const netBalance = totalIncome - totalExpense;

    const chartData = [
        { name: t.income, amount: totalIncome, fill: '#10b981' },
        { name: t.expense, amount: totalExpense, fill: '#ef4444' },
        { name: t.availableBalance, amount: netBalance, fill: '#1e3a8a' }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            {/* Main Balance Card */}
            <div className="primary-blue rounded-[32px] p-8 text-white shadow-2xl overflow-hidden relative border border-white/10">
                <div className="relative z-10 flex flex-col gap-1">
                    <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{t.availableBalance}</p>
                    <h2 className="text-4xl font-black tracking-tighter">₹ {netBalance.toLocaleString()}</h2>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5">
                            <span className="opacity-50 block text-[8px] font-bold uppercase tracking-widest">Cash in Hand</span>
                            <span className="text-xs font-black">₹ {netBalance.toLocaleString()}</span>
                        </div>
                        <div className="bg-rose-500/20 backdrop-blur-md px-3 py-2 rounded-2xl text-rose-200 border border-rose-500/30">
                            <span className="opacity-50 block text-[8px] font-bold uppercase tracking-widest">Labour Due</span>
                            <span className="text-xs font-black">₹ {labourStats.outstanding.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-rose-500/10 rounded-full blur-[60px]"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    title={t.totalIncome} 
                    value={totalIncome} 
                    icon={<ArrowUpCircle className="text-emerald-500" />} 
                    bgColor="bg-white"
                    textColor="text-emerald-600"
                />
                <StatCard 
                    title={t.totalExpense} 
                    value={totalExpense} 
                    icon={<ArrowDownCircle className="text-rose-500" />} 
                    bgColor="bg-white"
                    textColor="text-rose-600"
                />
            </div>

            {/* Partner Tracking - Rebuilt for better OOP tracking */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-black text-slate-800 text-sm tracking-tight">{t.partnerShare}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Investment + Personal Expenses</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-slate-400">
                        <ShieldCheck size={20} />
                    </div>
                </div>
                
                <div className="space-y-8">
                    <PartnerProgressDetailed 
                        stats={partnerStatsBreakdown.mujahir}
                        grandTotal={partnerStatsBreakdown.mujahir.total + partnerStatsBreakdown.salik.total}
                        color="bg-slate-900"
                        accentColor="bg-slate-400"
                    />
                    <div className="h-px bg-slate-100 w-full"></div>
                    <PartnerProgressDetailed 
                        stats={partnerStatsBreakdown.salik}
                        grandTotal={partnerStatsBreakdown.mujahir.total + partnerStatsBreakdown.salik.total}
                        color="bg-blue-600"
                        accentColor="bg-blue-300"
                    />
                </div>
            </div>

            {/* Recharts Chart Section */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 text-xs mb-6 uppercase tracking-[0.15em]">Cashflow Overview</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} 
                            />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={45}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, bgColor, textColor }: any) => (
    <div className={`${bgColor} p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all group`}>
        <div className="flex justify-between items-start">
            <span className="p-2.5 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">{icon}</span>
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">{title}</p>
            <p className={`text-lg font-black ${textColor} tracking-tight`}>₹ {value.toLocaleString()}</p>
        </div>
    </div>
);

const PartnerProgressDetailed = ({ stats, grandTotal, color, accentColor }: any) => {
    const percentage = grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0;
    
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center text-white`}>
                        <User size={16} />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-800 block leading-tight">{stats.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            Direct: ₹{stats.direct.toLocaleString()} + Spent: ₹{stats.spent.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block leading-tight">₹ {stats.total.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-blue-500">{Math.round(percentage)}% Share</span>
                </div>
            </div>
            
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-1 relative shadow-inner">
                <div 
                    className={`${color} h-full rounded-full transition-all duration-1000 relative z-10`} 
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20"></div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
