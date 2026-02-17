
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, Income, Expense, LabourProfile, Attendance, LabourPayment, Vendor } from '../types';
import { Trash2, Download, FileJson, Cloud, Loader2, Table, HelpCircle, X, ExternalLink, Info, Search, ShieldAlert, Copy, CheckCircle, PlusCircle, Settings } from 'lucide-react';

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
    const [showSetupGuide, setShowSetupGuide] = useState(false);
    const [copied, setCopied] = useState(false);

    const scriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  var payload = data.data;

  // 1. Sync Income (Direct Cash Injections)
  var sheetIncome = ss.getSheetByName("Direct_Incomes") || ss.insertSheet("Direct_Incomes");
  sheetIncome.clear();
  sheetIncome.appendRow(["Date", "Amount", "Source", "Paid By", "Mode", "Remarks"]);
  payload.incomes.forEach(function(i) {
    sheetIncome.appendRow([i.date, i.amount, i.source, i.paidBy, i.mode, i.remarks]);
  });

  // 2. Sync All Expenses
  var sheetExpense = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
  sheetExpense.clear();
  sheetExpense.appendRow(["Date", "Amount", "Category", "Paid To", "Payment Source", "Mode", "Notes"]);
  payload.expenses.forEach(function(e) {
    sheetExpense.appendRow([e.date, e.amount, e.category, e.paidTo, e.paidBy, e.mode, e.notes]);
  });

  // 3. Sync Labour Payments
  var sheetPayments = ss.getSheetByName("Labour_Payments") || ss.insertSheet("Labour_Payments");
  sheetPayments.clear();
  sheetPayments.appendRow(["Date", "Labour Name", "Amount", "Paid From", "Mode", "Type"]);
  payload.payments.forEach(function(p) {
    var worker = payload.labours.find(function(l) { return String(l.id) === String(p.labourId) });
    sheetPayments.appendRow([p.date, worker ? worker.name : "Unknown", p.amount, p.paidBy, p.mode, p.type]);
  });

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSyncToGoogleSheets = async () => {
        if (!settings.googleSheetUrl) {
            alert("त्रुटि: पहले Apps Script URL डालें!");
            setShowSetupGuide(true);
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
            alert("सिंक पूरा हुआ! अपनी गूगल शीट चेक करें।");
        } catch (error) {
            alert("सिंक फेल: क्या आपने Apps Script में 'Run' दबाकर Permission दी थी?");
        } finally {
            setIsSyncingSheets(false);
        }
    };

    const handleOpenSheet = () => {
        if (settings.googleSheetLink) window.open(settings.googleSheetLink, '_blank');
        else alert("कृपया पहले 'Sheet Link' वाले बॉक्स में अपनी गूगल शीट का लिंक पेस्ट करें।");
    };

    const handleExportExcel = () => {
        let csv = "\ufeffSECTION: DIRECT INCOME\nDate,Amount,Source,Paid By,Mode,Remarks\n";
        allData.incomes.forEach(i => csv += `${i.date},${i.amount},${i.source},${i.paidBy},${i.mode},"${(i.remarks || '').replace(/"/g, '""')}"\n`);
        
        csv += "\nSECTION: EXPENSES\nDate,Amount,Category,Paid To,Source,Mode,Notes\n";
        allData.expenses.forEach(e => csv += `${e.date},${e.amount},${e.category},"${(e.paidTo || '').replace(/"/g, '""')}",${e.paidBy},${e.mode},"${(e.notes || '').replace(/"/g, '""')}"\n`);
        
        csv += "\nSECTION: LABOUR PAYMENTS\nDate,Labour Name,Amount,Paid From,Mode\n";
        allData.payments.forEach(p => {
            const worker = allData.labours.find(l => String(l.id) === String(p.labourId));
            csv += `${p.date},${worker ? worker.name : 'Unknown'},${p.amount},${p.paidBy},${p.mode}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `EVS_Full_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleDownloadJSON = () => {
        const dataStr = JSON.stringify({ ...allData, settings }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `EVS_Full_Backup.json`;
        link.click();
    };

    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800">{t.settings}</h2>

            {/* Cloud Sync Section */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-2xl text-green-600"><Table size={22} /></div>
                        <h3 className="font-bold text-slate-800 text-sm">Google Sheets Cloud</h3>
                    </div>
                    <button onClick={() => setShowSetupGuide(true)} className="text-blue-600 flex items-center gap-1 font-bold text-[9px] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <PlusCircle size={14} /> Setup New
                    </button>
                </div>
                <div className="space-y-3">
                    <input type="url" placeholder="Apps Script URL" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none" value={settings.googleSheetUrl || ''} onChange={e => onUpdate({...settings, googleSheetUrl: e.target.value})} />
                    <input type="url" placeholder="Google Sheet Link" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] outline-none" value={settings.googleSheetLink || ''} onChange={e => onUpdate({...settings, googleSheetLink: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSyncToGoogleSheets} disabled={isSyncingSheets} className="py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                        {isSyncingSheets ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />} Sync Cloud
                    </button>
                    <button onClick={handleOpenSheet} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-all">
                        <ExternalLink size={16} /> Open Sheet
                    </button>
                </div>
            </div>

            {/* Setup Guide Modal */}
            {showSetupGuide && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Setup Cloud Sync</h3>
                            <button onClick={() => setShowSetupGuide(false)} className="bg-slate-100 p-2 rounded-full active:scale-90"><X size={24} /></button>
                        </div>
                        <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <h4 className="text-slate-800 font-black text-xs mb-3 flex items-center justify-between">
                                    Copy Script Code
                                    <button onClick={copyToClipboard} className="text-blue-600 flex items-center gap-1">{copied ? <CheckCircle size={14} /> : <Copy size={14} />} Copy</button>
                                </h4>
                                <pre className="text-[8px] bg-slate-900 text-blue-300 p-3 rounded-xl overflow-x-auto font-mono">{scriptCode.substring(0, 150)}...</pre>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600">शीट्स में 'Extensions' -> 'Apps Script' में कोड पेस्ट करें, 'Run' दबाकर Permission दें और फिर 'Deploy' करें।</p>
                        </div>
                        <button onClick={() => setShowSetupGuide(false)} className="w-full mt-6 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest">Close Guide</button>
                    </div>
                </div>
            )}

            {/* Offline Backups */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reports & Local Backups</h3>
                <button onClick={handleExportExcel} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95">
                    <Download size={18} /> Download Excel Report
                </button>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleDownloadJSON} className="p-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95">
                        <FileJson size={16} /> JSON Backup
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-4 border-2 border-dashed border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-wider active:bg-slate-50">
                        Restore File
                    </button>
                </div>
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

            {/* Language Selection */}
            <div className="bg-white p-5 rounded-[24px] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings size={20} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Language / भाषा</span>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => onUpdate({...settings, language: 'en'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${settings.language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                    <button onClick={() => onUpdate({...settings, language: 'hi'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${settings.language === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>हिन्दी</button>
                </div>
            </div>

            {/* Reset Area */}
            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
                <button onClick={onReset} className="w-full py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95">
                    <Trash2 size={18} className="inline mr-2" /> Reset All Data
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
