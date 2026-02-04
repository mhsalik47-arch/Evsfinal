import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, Income, Expense, LabourProfile, Attendance, LabourPayment, Vendor } from '../types';
import { Trash2, Download, FileJson, Cloud, Loader2, Table, HelpCircle, X, ExternalLink } from 'lucide-react';

interface SettingsViewProps {
    settings: AppSettings;
    onUpdate: (s: AppSettings) => void;
    onReset: () => void;
    onImport: (allData: any) => void;
    t: any;
    allData: {
        incomes: Income[];
        expenses: Expense[];
        labours: LabourProfile[];
        attendance: Attendance[];
        payments: LabourPayment[];
        vendors: Vendor[];
    };
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onReset, onImport, t, allData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSyncingSheets, setIsSyncingSheets] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(ios);
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        });
    }, []);

    const handleInstallApp = () => {
        if (isIOS) alert(t.iosInstallMsg);
        else if (installPrompt) installPrompt.prompt();
        else alert("Browser Menu (3 dots) -> Add to Home Screen");
    };

    const handleDownloadJSON = () => {
        const fullData = { 
            incomes: allData.incomes,
            expenses: allData.expenses,
            labours: allData.labours,
            attendance: allData.attendance,
            payments: allData.payments,
            vendors: allData.vendors,
            settings: settings,
            version: '1.2' 
        };
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EVS_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleSyncToGoogleSheets = async () => {
        if (!settings.googleSheetUrl) {
            alert("कृपया पहले Apps Script URL डालें।");
            return;
        }
        setIsSyncingSheets(true);
        try {
            const payload = {
                sheetName: settings.schoolName,
                timestamp: new Date().toLocaleString(),
                data: allData
            };
            await fetch(settings.googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert("डेटा सफलतापूर्वक शीट में भेज दिया गया है!");
        } catch (error) {
            alert("सिंक फेल हो गया! कृपया इंटरनेट और URL चेक करें।");
        } finally {
            setIsSyncingSheets(false);
        }
    };

    const handleExportExcel = () => {
        let csvContent = "\ufeffProject: " + settings.schoolName + "\n\n";
        
        csvContent += "1. INCOME\nDate,Amount,Paid By,Source,Mode,Remarks\n";
        allData.incomes.forEach(i => csvContent += `${i.date},${i.amount},${i.paidBy},${i.source},${i.mode},${i.remarks}\n`);

        csvContent += "\n2. EXPENSES & PAYMENTS\nDate,Amount,Category,Paid To,Mode,Notes\n";
        allData.expenses.forEach(e => {
            const vName = allData.vendors.find(v => v.id === e.vendorId)?.name || e.paidTo;
            csvContent += `${e.date},${e.amount},${e.category},${vName},${e.mode},${e.notes}\n`;
        });
        
        allData.payments.forEach(p => {
            const lName = allData.labours.find(l => l.id === p.labourId)?.name || 'Labour';
            csvContent += `${p.date},${p.amount},Labour,${lName},${p.mode},${p.type}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EVS_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800">{t.settings}</h2>

            {/* Google Sheets Sync Card */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-2xl text-green-600">
                            <Table size={22} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Google Sheet Sync</h3>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <HelpCircle size={20} />
                    </button>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apps Script URL</label>
                    <input 
                        type="url" 
                        placeholder="https://script.google.com/macros/s/..." 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs outline-none focus:border-green-200 transition-all font-medium"
                        value={settings.googleSheetUrl || ''}
                        onChange={e => onUpdate({...settings, googleSheetUrl: e.target.value})}
                    />
                </div>
                <button 
                    onClick={handleSyncToGoogleSheets}
                    disabled={isSyncingSheets}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-green-100"
                >
                    {isSyncingSheets ? <Loader2 className="animate-spin" size={18} /> : <Cloud size={18} />}
                    {t.syncSheetNow}
                </button>
            </div>

            {/* Excel Export Card */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reports</h3>
                <button onClick={handleExportExcel} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                    <Download size={18} /> Excel (CSV) Report Download
                </button>
            </div>

            {/* Data Backup Card */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Backup</h3>
                <button onClick={handleDownloadJSON} className="w-full p-5 bg-blue-600 text-white rounded-3xl font-black text-xs flex items-center justify-between shadow-lg shadow-blue-100 active:scale-90 transition-all">
                    <div className="flex items-center gap-3"><FileJson size={20} /> JSON Backup</div>
                    <Download size={16} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-200 text-slate-600 rounded-3xl font-bold text-xs hover:bg-slate-50 transition-colors">
                    Import From Backup File
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target?.result as string);
                            onImport(data);
                        } catch { alert("Invalid backup file!"); }
                    };
                    reader.readAsText(file);
                }} />
            </div>

            {/* PWA Install Card */}
            <div className={`p-6 rounded-[32px] text-white shadow-xl ${isIOS ? 'bg-slate-900' : 'bg-blue-900'}`}>
                <h3 className="font-bold text-sm mb-2">{t.installApp}</h3>
                <p className="text-[10px] text-white/60 mb-4">Install this app for faster access and offline usage.</p>
                <button onClick={handleInstallApp} className="w-full py-4 bg-white text-blue-900 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
                    Install Now
                </button>
            </div>

            {/* Language Selection */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-700">Display Language</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => onUpdate({...settings, language: 'en'})} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${settings.language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                    <button onClick={() => onUpdate({...settings, language: 'hi'})} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${settings.language === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>HI</button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
                <button onClick={onReset} className="w-full py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-xs hover:bg-rose-600 hover:text-white transition-all">
                    <Trash2 size={18} className="inline mr-2" /> {t.delete.toUpperCase()} ALL LOCAL DATA
                </button>
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Sheet Guide (मदद)</h3>
                            <button onClick={() => setShowHelp(false)} className="bg-slate-100 p-2 rounded-full active:scale-90">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-blue-600 uppercase">1. "Income" Tab</h4>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 overflow-x-auto">
                                    <table className="text-[9px] w-full text-left font-bold text-slate-500">
                                        <thead>
                                            <tr>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Date</th>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Amount</th>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Paid By</th>
                                                <th className="pb-2 border-b border-slate-200">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="pt-2">20-Oct</td>
                                                <td className="pt-2">₹50k</td>
                                                <td className="pt-2">Mujahir</td>
                                                <td className="pt-2">First Instal...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-rose-600 uppercase">2. "Expenses" Tab</h4>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 overflow-x-auto">
                                    <table className="text-[9px] w-full text-left font-bold text-slate-500">
                                        <thead>
                                            <tr>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Date</th>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Amount</th>
                                                <th className="pb-2 border-b border-slate-200 pr-2">Category</th>
                                                <th className="pb-2 border-b border-slate-200">Paid To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="pt-2">21-Oct</td>
                                                <td className="pt-2">₹12k</td>
                                                <td className="pt-2">Material</td>
                                                <td className="pt-2">Gupta Hardw...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <p className="text-[10px] text-amber-800 font-bold leading-relaxed flex items-start gap-2">
                                    <span className="mt-0.5">•</span>
                                    Apps Script URL को Google Sheet के 'Extensions' -> 'Apps Script' -> 'Deploy' से प्राप्त करें।
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowHelp(false)} 
                            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;