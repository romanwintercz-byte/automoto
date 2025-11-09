import React from 'react';
import { MaintenanceTask } from '../types';
import { BellIcon } from './icons';

interface InsuranceAlertBannerProps {
  task: MaintenanceTask;
  vehicleName: string;
  onDismiss: (taskId: string) => void;
  onShowTask: () => void;
}

export const InsuranceAlertBanner: React.FC<InsuranceAlertBannerProps> = ({ task, vehicleName, onDismiss, onShowTask }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.nextDueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  const daysText = daysUntilDue === 1 ? 'den' : (daysUntilDue >= 2 && daysUntilDue <= 4) ? 'dny' : 'dní';
  
  if (daysUntilDue < 0) return null; // Don't show for overdue tasks, they are handled elsewhere

  return (
    <div className="bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-300 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
      <div className="flex items-start sm:items-center">
        <BellIcon className="w-8 h-8 mr-4 text-yellow-400 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-white">Blíží se výročí pojištění!</h4>
          <p className="text-sm">
            Pojistka pro vozidlo '{vehicleName}' vyprší za {daysUntilDue} {daysText}. Nyní je ideální čas na přepočítání a porovnání nabídek.
          </p>
        </div>
      </div>
      <div className="flex space-x-2 self-end sm:self-center flex-shrink-0">
        <button
          onClick={onShowTask}
          className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
        >
          Zobrazit úkol
        </button>
        <button
          onClick={() => onDismiss(task.id)}
          className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
};
