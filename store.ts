
import { useState, useEffect, useMemo } from 'react';
import { Income, Expense, LabourProfile, Attendance, LabourPayment, AppSettings, Vendor } from './types';
import { translations } from './translations';

const STORAGE_KEYS = {
    INCOME: 'shiksha_income',
    EXPENSE: 'shiksha_expense',
    LABOUR: 'shiksha_labour',
    ATTENDANCE: 'shiksha_attendance',
    PAYMENTS: 'shiksha_payments',
    SETTINGS: 'shiksha_settings',
    VENDORS: 'shiksha_vendors',
    LAST_SYNC: 'shiksha_last_cloud_sync'
};

const getData = <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const saveData = <T,>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const useStore = () => {
    const [incomes, setIncomes] = useState<Income[]>(() => getData<Income[]>(STORAGE_KEYS.INCOME, []));
    const [expenses, setExpenses] = useState<Expense[]>(() => getData<Expense[]>(STORAGE_KEYS.EXPENSE, []));
    const [labours, setLabours] = useState<LabourProfile[]>(() => getData<LabourProfile[]>(STORAGE_KEYS.LABOUR, []));
    const [attendance, setAttendance] = useState<Attendance[]>(() => getData<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []));
    const [payments, setPayments] = useState<LabourPayment[]>(() => getData<LabourPayment[]>(STORAGE_KEYS.PAYMENTS, []));
    const [vendors, setVendors] = useState<Vendor[]>(() => getData<Vendor[]>(STORAGE_KEYS.VENDORS, []));
    const [settings, setSettings] = useState<AppSettings>(() => getData<AppSettings>(STORAGE_KEYS.SETTINGS, {
        schoolName: 'EVS School Project',
        location: 'Local',
        budget: 5000000,
        language: 'hi',
        autoSync: false
    }));

    // Sync state to localStorage whenever it changes
    useEffect(() => saveData(STORAGE_KEYS.INCOME, incomes), [incomes]);
    useEffect(() => saveData(STORAGE_KEYS.EXPENSE, expenses), [expenses]);
    useEffect(() => saveData(STORAGE_KEYS.LABOUR, labours), [labours]);
    useEffect(() => saveData(STORAGE_KEYS.ATTENDANCE, attendance), [attendance]);
    useEffect(() => saveData(STORAGE_KEYS.PAYMENTS, payments), [payments]);
    useEffect(() => saveData(STORAGE_KEYS.VENDORS, vendors), [vendors]);
    useEffect(() => saveData(STORAGE_KEYS.SETTINGS, settings), [settings]);

    const actions = useMemo(() => ({
        addIncome: (item: Income) => setIncomes(prev => [item, ...prev]),
        updateIncome: (item: Income) => setIncomes(prev => prev.map(i => String(i.id) === String(item.id) ? item : i)),
        deleteIncome: (id: string) => setIncomes(prev => prev.filter(i => String(i.id) !== String(id))),

        addExpense: (item: Expense) => {
            setExpenses(prev => [item, ...prev]);
            // If paid by a partner (not from project balance), add to income automatically
            if (item.paidBy !== 'Project Balance' && item.paidBy !== 'Other') {
                const t = translations[settings.language];
                const autoIncome: Income = {
                    id: `auto-inc-${item.id}`,
                    date: item.date,
                    amount: item.amount,
                    source: 'Investment',
                    paidBy: item.paidBy,
                    mode: item.mode,
                    remarks: `${t.autoIncomeRemark}: ${item.paidTo}`,
                    synced: true
                };
                setIncomes(prev => [autoIncome, ...prev]);
            }
        },
        updateExpense: (item: Expense) => {
            setExpenses(prev => prev.map(e => String(e.id) === String(item.id) ? item : e));
            
            // Handle auto-income update
            const autoIncId = `auto-inc-${item.id}`;
            if (item.paidBy !== 'Project Balance' && item.paidBy !== 'Other') {
                const t = translations[settings.language];
                const autoIncome: Income = {
                    id: autoIncId,
                    date: item.date,
                    amount: item.amount,
                    source: 'Investment',
                    paidBy: item.paidBy,
                    mode: item.mode,
                    remarks: `${t.autoIncomeRemark}: ${item.paidTo}`,
                    synced: true
                };
                setIncomes(prev => {
                    const exists = prev.find(i => i.id === autoIncId);
                    if (exists) {
                        return prev.map(i => i.id === autoIncId ? autoIncome : i);
                    } else {
                        return [autoIncome, ...prev];
                    }
                });
            } else {
                // If changed back to Project Balance, remove the auto-income
                setIncomes(prev => prev.filter(i => i.id !== autoIncId));
            }
        },
        deleteExpense: (id: string) => {
            setExpenses(prev => prev.filter(e => String(e.id) !== String(id)));
            // Also remove linked auto-income
            setIncomes(prev => prev.filter(i => i.id !== `auto-inc-${id}`));
        },

        addLabour: (item: LabourProfile) => setLabours(prev => [item, ...prev]),
        updateLabour: (item: LabourProfile) => setLabours(prev => prev.map(l => String(l.id) === String(item.id) ? item : l)),
        deleteLabour: (id: string) => {
            setLabours(prev => prev.filter(l => String(l.id) !== String(id)));
            setAttendance(prev => prev.filter(a => String(a.labourId) !== String(id)));
            setPayments(prev => prev.filter(p => String(p.labourId) !== String(id)));
        },

        addVendor: (item: Vendor) => setVendors(prev => [item, ...prev]),
        updateVendor: (item: Vendor) => setVendors(prev => prev.map(v => String(v.id) === String(item.id) ? item : v)),
        deleteVendor: (id: string) => setVendors(prev => prev.filter(v => String(v.id) !== String(id))),

        markAttendance: (item: Attendance) => {
            setAttendance(prev => {
                const filtered = prev.filter(a => !(String(a.labourId) === String(item.labourId) && a.date === item.date));
                return [item, ...filtered];
            });
        },
        updateAttendance: (item: Attendance) => setAttendance(prev => prev.map(a => String(a.id) === String(item.id) ? item : a)),
        deleteAttendance: (id: string) => setAttendance(prev => prev.filter(a => String(a.id) !== String(id))),

        addPayment: (item: LabourPayment) => {
            setPayments(prev => [item, ...prev]);
            // If paid by a partner, add to income automatically
            if (item.paidBy !== 'Project Balance' && item.paidBy !== 'Other') {
                const t = translations[settings.language];
                const autoIncome: Income = {
                    id: `auto-inc-pay-${item.id}`,
                    date: item.date,
                    amount: item.amount,
                    source: 'Investment',
                    paidBy: item.paidBy,
                    mode: item.mode,
                    remarks: `${t.autoIncomeRemark}: Labour Payment`,
                    synced: true
                };
                setIncomes(prev => [autoIncome, ...prev]);
            }
        },
        updatePayment: (item: LabourPayment) => {
            setPayments(prev => prev.map(p => String(p.id) === String(item.id) ? item : p));
            
            const autoIncId = `auto-inc-pay-${item.id}`;
            if (item.paidBy !== 'Project Balance' && item.paidBy !== 'Other') {
                const t = translations[settings.language];
                const autoIncome: Income = {
                    id: autoIncId,
                    date: item.date,
                    amount: item.amount,
                    source: 'Investment',
                    paidBy: item.paidBy,
                    mode: item.mode,
                    remarks: `${t.autoIncomeRemark}: Labour Payment`,
                    synced: true
                };
                setIncomes(prev => {
                    const exists = prev.find(i => i.id === autoIncId);
                    if (exists) {
                        return prev.map(i => i.id === autoIncId ? autoIncome : i);
                    } else {
                        return [autoIncome, ...prev];
                    }
                });
            } else {
                setIncomes(prev => prev.filter(i => i.id !== autoIncId));
            }
        },
        deletePayment: (id: string) => {
            setPayments(prev => prev.filter(p => String(p.id) !== String(id)));
            setIncomes(prev => prev.filter(i => i.id !== `auto-inc-pay-${id}`));
        },

        updateSettings: (newSettings: AppSettings) => setSettings(newSettings),
        importData: (allData: any) => {
            try {
                if (allData.incomes) saveData(STORAGE_KEYS.INCOME, allData.incomes);
                if (allData.expenses) saveData(STORAGE_KEYS.EXPENSE, allData.expenses);
                if (allData.labours) saveData(STORAGE_KEYS.LABOUR, allData.labours);
                if (allData.attendance) saveData(STORAGE_KEYS.ATTENDANCE, allData.attendance);
                if (allData.payments) saveData(STORAGE_KEYS.PAYMENTS, allData.payments);
                if (allData.vendors) saveData(STORAGE_KEYS.VENDORS, allData.vendors);
                if (allData.settings) saveData(STORAGE_KEYS.SETTINGS, allData.settings);
                window.location.reload();
            } catch (e) {
                console.error("Failed to import data", e);
                alert("Import failed: Data structure mismatch");
            }
        },
        resetAll: () => {
            Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
            window.location.reload();
        }
    }), [setIncomes, setExpenses, setLabours, setAttendance, setPayments, setVendors, setSettings]);

    return { incomes, expenses, labours, attendance, payments, vendors, settings, actions };
};
