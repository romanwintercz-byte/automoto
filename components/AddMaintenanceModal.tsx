import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { MaintenanceTask, ExpenseCategory } from '../types';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<MaintenanceTask, 'id' | 'vehicleId'>) => void;
}

type TaskTemplate = {
    name: string;
    taskType: 'maintenance' | 'reminder';
    category: ExpenseCategory;
    intervalMonths?: number;
};

const templates: { [key: string]: TaskTemplate } = {
    'stk': { name: 'Technická kontrola', taskType: 'maintenance', category: ExpenseCategory.MAINTENANCE, intervalMonths: 24 },
    'insurance': { name: 'Pojištění vozidla', taskType: 'reminder', category: ExpenseCategory.INSURANCE, intervalMonths: 12 },
    'vignette': { name: 'Dálniční známka', taskType: 'reminder', category: ExpenseCategory.OTHER, intervalMonths: 12 },
    'oil': { name: 'Výměna oleje a filtrů', taskType: 'maintenance', category: ExpenseCategory.MAINTENANCE, intervalMonths: 12 },
}

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [name, setName] = useState('');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueOdometer, setNextDueOdometer] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [intervalMonths, setIntervalMonths] = useState<number | ''>('');
  const [intervalOdometer, setIntervalOdometer] = useState<number | ''>('');
  const [taskType, setTaskType] = useState<'maintenance' | 'reminder'>('maintenance');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.MAINTENANCE);

  const clearForm = () => {
    setName('');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setNextDueOdometer('');
    setNotes('');
    setIntervalMonths('');
    setIntervalOdometer('');
    setTaskType('maintenance');
    setCategory(ExpenseCategory.MAINTENANCE);
  }
  
  useEffect(() => {
    if (isOpen) {
        clearForm();
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: TaskTemplate) => {
    setName(template.name);
    setTaskType(template.taskType);
    setCategory(template.category);
    setIntervalMonths(template.intervalMonths || '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && nextDueDate) {
      onAddTask({ 
        name, 
        nextDueDate, 
        nextDueOdometer: taskType === 'maintenance' ? nextDueOdometer : '', 
        notes,
        intervalMonths: intervalMonths || undefined,
        intervalOdometer: taskType === 'maintenance' ? (intervalOdometer || undefined) : undefined,
        taskType,
        category,
    });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Naplánovat údržbu nebo připomínku">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Šablony pro rychlé přidání</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(templates).map(t => (
                    <button type="button" key={t.name} onClick={() => handleTemplateSelect(t)} className="p-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-center">
                        {t.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="border-t border-slate-700 my-4"></div>

        <div>
          <label className="block text-sm font-medium text-gray-400">Typ záznamu</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <button type="button" onClick={() => { setTaskType('maintenance'); setCategory(ExpenseCategory.MAINTENANCE); }} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${taskType === 'maintenance' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
                Servisní úkon
            </button>
            <button type="button" onClick={() => { setTaskType('reminder'); setCategory(ExpenseCategory.OTHER); }} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${taskType === 'reminder' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
                Připomínka
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="task-name" className="block text-sm font-medium text-gray-400">Název úkolu</label>
          <input
            type="text"
            id="task-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="např. Výměna oleje"
          />
        </div>
        
        {taskType === 'reminder' && (
             <div>
                <label htmlFor="task-category" className="block text-sm font-medium text-gray-400">Kategorie nákladu</label>
                <select id="task-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value={ExpenseCategory.INSURANCE}>Pojištění</option>
                    <option value={ExpenseCategory.MAINTENANCE}>Údržba</option>
                    <option value={ExpenseCategory.OTHER}>Ostatní</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Tato kategorie bude použita při vytvoření nákladu po dokončení připomínky.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="next-due-date" className="block text-sm font-medium text-gray-400">Příští termín</label>
              <input
                type="date"
                id="next-due-date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {taskType === 'maintenance' && (
                <div>
                  <label htmlFor="next-due-odometer" className="block text-sm font-medium text-gray-400">Při km (volitelné)</label>
                  <input
                    type="number"
                    id="next-due-odometer"
                    value={nextDueOdometer}
                    onChange={(e) => setNextDueOdometer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="např. 150000"
                  />
                </div>
            )}
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
             <h4 className="font-semibold text-white">Opakování (volitelné)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="interval-months" className="block text-sm font-medium text-gray-400">Opakovat po měsících</label>
                  <input
                    type="number"
                    id="interval-months"
                    value={intervalMonths}
                    onChange={(e) => setIntervalMonths(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="např. 12"
                  />
                </div>
                 {taskType === 'maintenance' && (
                    <div>
                      <label htmlFor="interval-odometer" className="block text-sm font-medium text-gray-400">Opakovat po km</label>
                      <input
                        type="number"
                        id="interval-odometer"
                        value={intervalOdometer}
                        onChange={(e) => setIntervalOdometer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="např. 15000"
                      />
                    </div>
                 )}
            </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-400">Poznámky (volitelné)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="např. Olej 5W-30"
          />
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
            Zrušit
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
            Naplánovat
          </button>
        </div>
      </form>
    </Modal>
  );
};