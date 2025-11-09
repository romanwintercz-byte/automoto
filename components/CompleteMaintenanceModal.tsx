import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { MaintenanceTask } from '../types';

interface CompleteMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask | null;
  currentOdometer: number;
  onComplete: (completionData: {taskId: string, date: string, amount: number, odometer: number | ''}) => void;
}

export const CompleteMaintenanceModal: React.FC<CompleteMaintenanceModalProps> = ({ isOpen, onClose, task, currentOdometer, onComplete }) => {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [odometer, setOdometer] = useState<number | ''>('');
  
  useEffect(() => {
    if (task) {
        setDate(new Date().toISOString().split('T')[0]);
        setOdometer(currentOdometer > 0 ? currentOdometer : '');
        setAmount('');
    }
  }, [task, currentOdometer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task && amount) {
      onComplete({ 
          taskId: task.id,
          date, 
          amount, 
          odometer
      });
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dokončit: ${task.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-400">Zadejte údaje o provedené údržbě. Záznam bude automaticky přidán do nákladů.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="complete-date" className="block text-sm font-medium text-gray-400">Datum provedení</label>
            <input
              type="date"
              id="complete-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="complete-amount" className="block text-sm font-medium text-gray-400">Cena (Kč)</label>
            <input
              type="number"
              id="complete-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="0"
            />
          </div>
        </div>
        <div>
            <label htmlFor="complete-odometer" className="block text-sm font-medium text-gray-400">Stav tachometru (volitelné)</label>
            <input
              type="number"
              id="complete-odometer"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={`${currentOdometer > 0 ? currentOdometer : 'např. 150000'}`}
            />
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
            Zrušit
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
            Dokončit a zaznamenat
          </button>
        </div>
      </form>
    </Modal>
  );
};