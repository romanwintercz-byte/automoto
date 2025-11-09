export enum ExpenseCategory {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  isArchived?: boolean;
  photo?: string; // Base64 encoded image
  isSample?: boolean; // Flag for sample data vehicles
}

export interface Expense {
  id: string;
  vehicleId: string;
  date: string; // ISO string format
  category: ExpenseCategory;
  amount: number;
  description: string;
  attachment?: string; // Base64 encoded image
  // Fuel specific fields
  odometer?: number;
  liters?: number;
  pricePerLiter?: number;
}

export interface MaintenanceTask {
    id: string;
    vehicleId: string;
    name: string;
    nextDueDate: string;
    nextDueOdometer: number | '';
    notes: string;
    intervalMonths?: number;
    intervalOdometer?: number;
    taskType: 'maintenance' | 'reminder';
    category: ExpenseCategory;
}