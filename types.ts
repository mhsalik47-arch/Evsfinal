export type PaymentMode = 'Cash' | 'Bank' | 'UPI' | 'Check';
export type IncomeSource = 'Investment' | 'Loan' | 'Donation' | 'Other';
export type ExpenseCategory = 'Material' | 'Labour' | 'Food' | 'Transport' | 'Utility' | 'Contractor' | 'Other';

export type LabourSubCategory = 'Mistry' | 'Majdoor' | 'Plumber' | 'Electrician' | 'Painter' | 'Carpenter';
export type MaterialSubCategory = 'Cement' | 'Saria' | 'Sand/Bajri' | 'Grit' | 'Bricks' | 'Tiles' | 'Paint' | 'Hardware' | 'Electrical' | 'Plumbing' | 'Other Material';
export type FoodSubCategory = 'Tea/Snacks' | 'Lunch' | 'Dinner' | 'Water' | 'Other Food';

export type ExpenseSubCategory = LabourSubCategory | MaterialSubCategory | FoodSubCategory | string;

export type Partner = 'Master Mujahir' | 'Dr. Salik' | 'Other';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half-Day';

export interface Vendor {
    id: string;
    name: string;
    category: ExpenseCategory;
    mobile?: string;
}

export interface Income {
    id: string;
    date: string;
    amount: number;
    source: IncomeSource;
    paidBy: Partner;
    mode: PaymentMode;
    remarks: string;
    synced: boolean;
}

export interface Expense {
    id: string;
    date: string;
    amount: number;
    category: ExpenseCategory;
    subCategory?: ExpenseSubCategory;
    paidTo: string;
    vendorId?: string; // ID of the saved vendor
    mode: PaymentMode;
    notes: string;
    synced: boolean;
}

export interface LabourProfile {
    id: string;
    name: string;
    mobile: string;
    workType: string;
    dailyWage: number;
}

export interface Attendance {
    id: string;
    labourId: string;
    date: string;
    status: AttendanceStatus;
    overtimeHours: number;
}

export interface LabourPayment {
    id: string;
    labourId: string;
    date: string;
    amount: number;
    type: 'Advance' | 'Full Payment';
    mode: PaymentMode;
}

export interface AppSettings {
    schoolName: string;
    location: string;
    budget: number;
    language: 'en' | 'hi';
    autoSync: boolean;
    syncEmail?: string;
    googleSheetUrl?: string; // Web App Script URL
    googleSheetLink?: string; // Direct Spreadsheet Link
}