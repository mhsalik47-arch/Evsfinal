import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, Income, Expense, LabourProfile, Attendance, LabourPayment, Vendor } from '../types';
import { Languages, Trash2, Smartphone, Download, Share2, FileJson, Cloud, Check, Loader2, RefreshCw, Apple, Copy, Table, HelpCircle, FileSpreadsheet } from 'lucide-react';

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
    const [isCopied, setIsCopied] = useState(false);
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
        link.download = `Shiksha_Setu_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleCopyToClipboard = () => {
        const fullData = { ...allData, settings };
        navigator.clipboard.writeText(JSON.stringify(fullData)).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            alert("डेटा कॉपी हो गया!");
        });
    };

    const handleSyncToGoogleSheets = async () => {
        if (!settings.googleSheetUrl) {
            alert("कृपया पहले URL डालें।");
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
            alert("सिंक पूरा हुआ!");
        } catch (error) {
            alert("सिंक फेल!");
        } finally {
            setIsSyncingSheets(false);
        }
    };

    const handleExportExcel = () => {
        let csvContent = "\ufeffProject: " + settings.schoolName + "\n\n";
        
        csvContent += "1. INCOME\nDate,Amount,Paid By,Source\n";
        allData.incomes.forEach(i => csvContent += `${i.date},${i.amount},${i.paidBy},${i.source}\n`);

        csvContent += "\n2. EXPENSES\nDate,Amount,Vendor,Category\n";
        allData.expenses.forEach(e => {
            const vName = allData.vendors.find(v => v.id === e.vendorId)?.name || e.paidTo;
            csvContent += `${e.date},${e.amount},${vName},${e.category}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Report_${settings.schoolName}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800">{t.settings}</h2>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-2xl text-green-600">
                            <Table size={22} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Google Sheet Sync</h3>
                    </div>
                </div>
                <input 
                    type="url" 
                    placeholder="Apps Script URL यहाँ डालें" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs outline-none"
                    value={settings.googleSheetUrl || ''}
                    onChange={e => onUpdate({...settings, googleSheetUrl: e.target.value})}
                />
                <button 
                    onClick={handleSyncToGoogleSheets}
                    disabled={isSyncingSheets}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isSyncingSheets ? <Loader2 className="animate-spin" size={18} /> : <Cloud size={18} />}
                    {t.syncSheetNow}
                </button>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <button onClick={handleExportExcel} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3">
                    <Download size={18} /> Excel Report
                </button>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <button onClick={handleDownloadJSON} className="w-full p-5 bg-blue-600 text-white rounded-3xl font-black text-xs flex items-center justify-between">
                    <div className="flex items-center gap-3"><FileJson size={20} /> JSON Backup</div>
                    <Download size={16} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-200 text-slate-600 rounded-3xl font-bold text-xs">
                    Import Backup
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target?.result as string);
                            onImport(data);
                        } catch { alert("Invalid file!"); }
                    };
                    reader.readAsText(file);
                }} />
            </div>

            <div className={`p-6 rounded-[32px] text-white shadow-xl ${isIOS ? 'bg-slate-900' : 'bg-blue-900'}`}>
                <h3 className="font-bold text-sm mb-2">{t.installApp}</h3>
                <button onClick={handleInstallApp} className="w-full py-4 bg-white text-blue-900 rounded-2xl font-black text-xs uppercase shadow-lg">
                    Install Now
                </button>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-sm">Language</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => onUpdate({...settings, language: 'en'})} className={`px-4 py-2 rounded-lg text-[10px] font-black ${settings.language === 'en' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>EN</button>
                    <button onClick={() => onUpdate({...settings, language: 'hi'})} className={`px-4 py-2 rounded-lg text-[10px] font-black ${settings.language === 'hi' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>HI</button>
                </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
                <button onClick={onReset} className="w-full py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-xs">
                    <Trash2 size={18} className="inline mr-2" /> DELETE ALL DATA
                </button>
            </div>
        </div>
    );
};

export default SettingsView;