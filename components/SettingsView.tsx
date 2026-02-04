import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, Income, Expense, LabourProfile, Attendance, LabourPayment, Vendor } from '../types';
import { Trash2, Download, FileJson, Cloud, Loader2, Table, HelpCircle, X, ExternalLink, Info, Search } from 'lucide-react';

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

    const handleSyncToGoogleSheets = async () => {
        if (!settings.googleSheetUrl) {
            alert("त्रुटि: कृपया पहले Apps Script URL डालें!");
            return;
        }
        
        if (!settings.googleSheetUrl.includes("script.google.com")) {
            alert("चेतावनी: यह एक वैध Apps Script URL नहीं लग रहा है। कृपया इसे चेक करें।");
        }

        setIsSyncingSheets(true);
        try {
            const payload = {
                sheetName: settings.schoolName,
                timestamp: new Date().toLocaleString(),
                data: allData
            };
            
            // Note: mode: 'no-cors' is often needed for Google Apps Script redirects
            await fetch(settings.googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            alert("सफलता: डाटा सिंक करने का कमांड भेज दिया गया है! (कृपया अपनी शीट चेक करें)");
        } catch (error) {
            console.error(error);
            alert("सिंक फेल: इंटरनेट कनेक्शन या URL की जांच करें।");
        } finally {
            setIsSyncingSheets(false);
        }
    };

    const handleOpenSheet = () => {
        if (settings.googleSheetLink) {
            window.open(settings.googleSheetLink, '_blank');
        } else {
            alert("पहले 'Sheet Link' वाले बॉक्स में अपनी गूगल शीट का लिंक पेस्ट करें।");
        }
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
                        <h3 className="font-bold text-slate-800 text-sm">Google Sheet Cloud</h3>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="text-blue-600 flex items-center gap-1 font-bold text-[10px] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <HelpCircle size={14} /> Help
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Apps Script URL</label>
                            <span className="text-[9px] text-green-500 font-bold">Required for Sync</span>
                        </div>
                        <input 
                            type="url" 
                            placeholder="https://script.google.com/macros/s/..." 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none focus:border-green-300 transition-all font-medium"
                            value={settings.googleSheetUrl || ''}
                            onChange={e => onUpdate({...settings, googleSheetUrl: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">2. Sheet Link (URL)</label>
                        <input 
                            type="url" 
                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none focus:border-blue-300 transition-all font-medium"
                            value={settings.googleSheetLink || ''}
                            onChange={e => onUpdate({...settings, googleSheetLink: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleSyncToGoogleSheets}
                        disabled={isSyncingSheets}
                        className="py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-green-100 uppercase tracking-wider"
                    >
                        {isSyncingSheets ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
                        Sync Now
                    </button>
                    <button 
                        onClick={handleOpenSheet}
                        className="py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-200 uppercase tracking-wider"
                    >
                        <ExternalLink size={16} />
                        Open Sheet
                    </button>
                </div>
            </div>

            {/* Excel & Backup Cards */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reports</h3>
                    <button onClick={handleExportExcel} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                        <Download size={18} /> Excel (CSV) Report Download
                    </button>
                </div>

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
                    <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Sync Guide (मदद)</h3>
                            <button onClick={() => setShowHelp(false)} className="bg-slate-100 p-2.5 rounded-full active:scale-90 transition-all">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                                <h4 className="flex items-center gap-2 text-blue-800 font-black text-sm mb-3">
                                    <Search size={18} /> शीट नहीं मिल रही? (Find It)
                                </h4>
                                <ul className="text-[11px] text-blue-700/80 font-bold space-y-3">
                                    <li className="flex gap-2"><span className="text-blue-500">1.</span> Google Drive (drive.google.com) खोलें।</li>
                                    <li className="flex gap-2"><span className="text-blue-500">2.</span> अपनी Gmail से लॉगिन करें जिससे शीट बनाई थी।</li>
                                    <li className="flex gap-2"><span className="text-blue-500">3.</span> सर्च में लिखें: <b>"{settings.schoolName}"</b></li>
                                    <li className="flex gap-2"><span className="text-blue-500">4.</span> "Recent" (हालिया) सेक्शन में चेक करें।</li>
                                </ul>
                                <button 
                                    onClick={() => window.open('https://drive.google.com/drive/recent', '_blank')}
                                    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                >
                                    Go to Google Drive
                                </button>
                            </div>

                            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                                <h4 className="flex items-center gap-2 text-amber-800 font-black text-sm mb-3">
                                    <Info size={18} /> डाटा सिंक नहीं हो रहा? (Fix It)
                                </h4>
                                <ul className="text-[11px] text-amber-700/80 font-bold space-y-3">
                                    <li className="flex gap-2"><span>•</span> <b>Apps Script:</b> चेक करें कि आपने 'Deploy' करते समय <b>'Anyone'</b> चुना था या नहीं।</li>
                                    <li className="flex gap-2"><span>•</span> <b>URL:</b> सुनिश्चित करें कि URL के आखिर में कोई स्पेस (Space) नहीं है।</li>
                                    <li className="flex gap-2"><span>•</span> <b>Internet:</b> सिंक बटन दबाते समय इंटरनेट चालू रखें।</li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <h4 className="text-slate-800 font-black text-sm mb-3 uppercase tracking-tighter">जरूरी स्टेप्स (Must Follow)</h4>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    शीट मिलने के बाद, ब्राउज़र के एड्रेस बार से उसका लिंक कॉपी करें और ऐप के <b>"Sheet Link"</b> वाले बॉक्स में पेस्ट कर दें। इससे आप भविष्य में एक क्लिक में शीट खोल पाएंगे।
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowHelp(false)} 
                            className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl"
                        >
                            बंद करें (Close)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;