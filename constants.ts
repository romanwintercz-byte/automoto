
import { ExpenseCategory } from './types';

export const CATEGORY_DETAILS: { [key in ExpenseCategory]: { name: string; color: string } } = {
  [ExpenseCategory.FUEL]: { name: 'Pohonné hmoty', color: 'bg-blue-500' },
  [ExpenseCategory.MAINTENANCE]: { name: 'Údržba', color: 'bg-green-500' },
  [ExpenseCategory.INSURANCE]: { name: 'Pojištění', color: 'bg-yellow-500' },
  [ExpenseCategory.OTHER]: { name: 'Ostatní', color: 'bg-purple-500' },
};
