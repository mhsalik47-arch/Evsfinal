
import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Settings as SettingsIcon,
    CheckCircle2,
    CloudOff,
    School
} from 'lucide-react';
import { useStore } from './store';
import { translations } from './translations';
import DashboardView from './components/DashboardView';
import IncomeView from './components/IncomeView';
import ExpenseView from './components/ExpenseView';
import LabourView from './components/LabourView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
    const { incomes, expenses, labours, attendance, payments, vendors, settings, actions } = useStore();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const t = translations[settings.language];
    const allData = { incomes, expenses, labours, attendance, payments, vendors };

    const renderView = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView incomes={incomes} expenses={expenses} labours={labours} attendance={attendance} payments={payments} t={t} settings={settings} />;
            case 'income': return <IncomeView incomes={incomes} expenses={expenses} payments={payments} onAdd={actions.addIncome} onUpdate={actions.updateIncome} onDelete={actions.deleteIncome} t={t} />;
            case 'expense': return <ExpenseView expenses={expenses} payments={payments} labours={labours} vendors={vendors} onAdd={actions.addExpense} onUpdate={actions.updateExpense} onDelete={actions.deleteExpense} onDeletePayment={actions.deletePayment} onAddVendor={actions.addVendor} onUpdateVendor={actions.updateVendor} onDeleteVendor={actions.deleteVendor} t={t} />;
            case 'labour': return (
                <LabourView 
                    labours={labours} 
                    attendance={attendance} 
                    payments={payments} 
                    onAddLabour={actions.addLabour} 
                    onUpdateLabour={actions.updateLabour} 
                    onDeleteLabour={actions.deleteLabour} 
                    onAddAttendance={actions.markAttendance} 
                    onUpdateAttendance={actions.updateAttendance}
                    onDeleteAttendance={actions.deleteAttendance} 
                    onAddPayment={actions.addPayment} 
                    onUpdatePayment={actions.updatePayment}
                    onDeletePayment={actions.deletePayment} 
                    t={t} 
                />
            );
            case 'settings': return (
                <SettingsView 
                    settings={settings} 
                    onUpdate={actions.updateSettings} 
                    onReset={actions.resetAll} 
                    onImport={actions.importData}
                    t={t}
                    allData={allData}
                />
            );
            default: return <DashboardView incomes={incomes} expenses={expenses} labours={labours} attendance={attendance} payments={payments} t={t} settings={settings} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
            <header className="primary-blue text-white px-4 py-3 sticky top-0 z-50 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <School size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{t.appName}</h1>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest">{settings.schoolName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-[10px] bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                            <CheckCircle2 size={12} />
                            <span>{t.synced}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] bg-amber-500/20 px-2 py-1 rounded-full border border-amber-500/30">
                            <CloudOff size={12} />
                            <span>{t.offline}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full">
                {renderView()}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-2 px-1 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label={t.dashboard} />
                <NavButton active={activeTab === 'income'} onClick={() => setActiveTab('income')} icon={<TrendingUp size={20} />} label={t.income} />
                <NavButton active={activeTab === 'expense'} onClick={() => setActiveTab('expense')} icon={<TrendingDown size={20} />} label={t.expense} />
                <NavButton active={activeTab === 'labour'} onClick={() => setActiveTab('labour')} icon={<Users size={20} />} label={t.labour} />
                <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label={t.settings} />
            </nav>
        </div>
    );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
            active ? 'text-primary-blue bg-blue-50' : 'text-slate-400'
        }`}
    >
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
);

export default App;
