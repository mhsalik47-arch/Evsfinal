import React, { useRef, width, useState, useEffect } from 'react';
import { AppSettings, Income, Expense, LabourProfile, Attendance, LabourPayment, Vendor } from '../types';
import { Trash2, Download, FileJson, Cloud, Loader2, Table, HelpCircle, X, ExternalLink, Info, Search, ShieldAlert, Copy, CheckCircle } from 'lucide-react';

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
    const [showScriptFix, setShowScriptFix] = useState(false);
    const [copied, setCopied] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    const scriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("EVS_Data") || ss.insertSheet("EVS_Data");
  
  var data = JSON.parse(e.postData.contents);
  var timestamp = data.timestamp;
  var schoolName = data.sheetName;
  
  // Clear and write header
  sheet.clear();
  sheet.appendRow(["EVS School Project Sync", "Last Updated: " + timestamp]);
  sheet.appendRow([""]);
  
  // Income Section
  sheet.appendRow(["INCOME DATA"]);
  sheet.appendRow(["Date", "Amount", "Source", "Paid By", "Mode", "Remarks"]);
  data.data.incomes.forEach(function(i) {
    sheet.appendRow([i.date, i.amount, i.source, i.paidBy, i.mode, i.remarks]);
  });
  
  sheet.appendRow([""]);
  sheet.appendRow(["EXPENSE DATA"]);
  sheet.appendRow(["Date", "Amount", "Category", "Paid To", "Mode", "Notes"]);
  data.data.expenses.forEach(function(exp) {
    sheet.appendRow([exp.date, exp.amount, exp.category, exp.paidTo, exp.mode, exp.notes]);
  });

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`;

    useEffect(() => {
        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(ios);
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        });
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSyncToGoogleSheets = async () => {
        if (!settings.googleSheetUrl) {
            alert("त्रुटि: पहले Apps Script URL डालें!");
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
            alert("सिंक कमांड भेज दिया गया! अगर डाटा नहीं आया, तो 'Help' में जाकर Permissions ठीक करें।");
        } catch (error) {
            alert("सिंक फेल हो गया!");
        } finally {
            setIsSyncingSheets(false);
        }
    };

    const handleOpenSheet = () => {
        if (settings.googleSheetLink) window.open(settings.googleSheetLink, '_blank');
        else alert("Sheet Link डालें।");
    };

    // Fix: Implement handleExportExcel to export application data as a CSV file
    const handleExportExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Income Header & Data
        csvContent += "SECTION: INCOME\nDate,Amount,Source,Paid By,Mode,Remarks\n";
        allData.incomes.forEach(i => {
            csvContent += `${i.date},${i.amount},${i.source},${i.paidBy},${i.mode},"${(i.remarks || '').replace(/"/g, '""')}"\n`;
        });
        
        csvContent += "\nSECTION: EXPENSES\nDate,Amount,Category,Paid To,Mode,Notes\n";
        allData.expenses.forEach(e => {
            csvContent += `${e.date},${e.amount},${e.category},"${(e.paidTo || '').replace(/"/g, '""')}",${e.mode},"${(e.notes || '').replace(/"/g, '""')}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `evs_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Fix: Implement handleDownloadJSON to export a full backup of application data in JSON format
    const handleDownloadJSON = () => {
        const dataStr = JSON.stringify({ ...allData, settings, backupDate: new Date().toISOString() }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `evs_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                    <button onClick={() => setShowScriptFix(true)} className="text-rose-600 flex items-center gap-1 font-bold text-[9px] bg-rose-50 px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
                        <ShieldAlert size={14} /> Fix Errors
                    </button>
                </div>
                
                <div className="space-y-3">
                    <input 
                        type="url" 
                        placeholder="Apps Script URL (सिंक के लिए)" 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none focus:border-green-300 font-bold"
                        value={settings.googleSheetUrl || ''}
                        onChange={e => onUpdate({...settings, googleSheetUrl: e.target.value})}
                    />
                    <input 
                        type="url" 
                        placeholder="Sheet Link (खोलने के लिए)" 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none focus:border-blue-300 font-bold"
                        value={settings.googleSheetLink || ''}
                        onChange={e => onUpdate({...settings, googleSheetLink: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSyncToGoogleSheets} disabled={isSyncingSheets} className="py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 uppercase">
                        {isSyncingSheets ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />} Sync Now
                    </button>
                    <button onClick={handleOpenSheet} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 uppercase">
                        <ExternalLink size={16} /> Open Sheet
                    </button>
                </div>
                
                <button onClick={() => setShowHelp(true)} className="w-full py-2 text-blue-600 text-[10px] font-black uppercase flex items-center justify-center gap-2 bg-blue-50 rounded-xl">
                    <Search size={14}/> शीट नहीं मिल रही? गाइड देखें
                </button>
            </div>

            {/* Error Fix Modal */}
            {showScriptFix && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-rose-600 flex items-center gap-2 uppercase">
                                <ShieldAlert size={24}/> Fix Permission Error
                            </h3>
                            <button onClick={() => setShowScriptFix(false)} className="bg-slate-100 p-2 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                आपकी तस्वीर के अनुसार 100% एरर आ रहे हैं। इसका मतलब है कि Google Script को आपकी शीट इस्तेमाल करने की अनुमति नहीं मिली है। इसे ऐसे ठीक करें:
                            </p>

                            <div className="space-y-3">
                                <div className="flex gap-4 items-start">
                                    <span className="bg-rose-100 text-rose-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                                    <p className="text-[11px] font-bold text-slate-700">Apps Script एडिटर में जाएं और यह नया कोड वहां डालें:</p>
                                </div>
                                <div className="bg-slate-900 rounded-2xl p-4 relative">
                                    <pre className="text-[8px] text-blue-300 overflow-x-auto font-mono">
                                        {scriptCode.substring(0, 150)}...
                                    </pre>
                                    <button 
                                        onClick={copyToClipboard}
                                        className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all active:scale-90"
                                    >
                                        {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <span className="bg-rose-100 text-rose-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                                    <p className="text-[11px] font-bold text-slate-700">ऊपर <b>'Run'</b> बटन दबाएं। एक "Review Permissions" का बॉक्स आएगा, वहां अपनी ईमेल चुनकर <b>'Allow'</b> करें।</p>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <span className="bg-rose-100 text-rose-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                                    <p className="text-[11px] font-bold text-slate-700">दोबारा <b>'Deploy'</b> करें। 'Who has access' में <b>'Anyone'</b> ही चुनें।</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowScriptFix(false)} className="w-full mt-8 py-5 bg-rose-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">
                            Close Guide
                        </button>
                    </div>
                </div>
            )}

            {/* Standard Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Sync Guide (मदद)</h3>
                            <button onClick={() => setShowHelp(false)} className="bg-slate-100 p-2.5 rounded-full active:scale-90 transition-all">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                                <h4 className="flex items-center gap-2 text-blue-800 font-black text-sm mb-3">
                                    <Search size={18} /> शीट कैसे खोजें?
                                </h4>
                                <p className="text-[10px] text-blue-700 font-bold mb-4">Google Drive में 'Recent' सेक्शन चेक करें।</p>
                                <button onClick={() => window.open('https://drive.google.com/drive/recent', '_blank')} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase">
                                    Open Google Drive
                                </button>
                            </div>
                            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                                <h4 className="flex items-center gap-2 text-amber-800 font-black text-sm mb-2">सिंक नहीं हो रहा?</h4>
                                <p className="text-[10px] text-amber-700 font-bold">• 'Who has access' को 'Anyone' करें।</p>
                                <p className="text-[10px] text-amber-700 font-bold">• एक बार 'Run' करके परमिशन Allow करें।</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase">बंद करें</button>
                    </div>
                </div>
            )}

            {/* Reports & Backup */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Backup & Reports</h3>
                <button onClick={handleExportExcel} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 uppercase">
                    <Download size={18} /> Excel (CSV) Download
                </button>
                <button onClick={handleDownloadJSON} className="w-full p-4 bg-blue-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 uppercase">
                    <FileJson size={18} /> JSON Backup
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-bold text-[10px]">
                    RESTORE FROM FILE
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

            {/* Language & Reset */}
            <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 items-center justify-between">
                <span className="text-xs font-bold text-slate-500 ml-4 uppercase">Language</span>
                <div className="flex bg-slate-100 rounded-xl p-1">
                    <button onClick={() => onUpdate({...settings, language: 'en'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${settings.language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                    <button onClick={() => onUpdate({...settings, language: 'hi'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${settings.language === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>HI</button>
                </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
                <button onClick={onReset} className="w-full py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-xs uppercase">
                    <Trash2 size={18} className="inline mr-2" /> Delete All Data
                </button>
            </div>
        </div>
    );
};

export default SettingsView;