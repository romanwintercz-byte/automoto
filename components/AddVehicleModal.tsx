import React, { useState } from 'react';
import { Modal } from './Modal';
import { Vehicle } from '../types';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose, onAddVehicle }) => {
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Fotka je příliš velká. Maximální velikost je 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearForm = () => {
    setName('');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setPhoto(undefined);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && make && model && year) {
      onAddVehicle({ name, make, model, year, photo });
      onClose();
      clearForm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); clearForm(); }} title="Přidat nové vozidlo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="vehicle-name" className="block text-sm font-medium text-gray-400">Přezdívka vozidla</label>
          <input
            type="text"
            id="vehicle-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicle-make" className="block text-sm font-medium text-gray-400">Značka</label>
              <input
                type="text"
                id="vehicle-make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="vehicle-model" className="block text-sm font-medium text-gray-400">Model</label>
              <input
                type="text"
                id="vehicle-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
        </div>
        <div>
          <label htmlFor="vehicle-year" className="block text-sm font-medium text-gray-400">Rok výroby</label>
          <input
            type="number"
            id="vehicle-year"
            value={year}
            onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Fotka vozidla (volitelné)</label>
          <div className="mt-1 flex items-center space-x-4">
            {photo && (
                <img src={photo} alt="Náhled" className="h-16 w-16 object-cover rounded-md" />
            )}
            <input
                id="vehicle-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
            />
            <label htmlFor="vehicle-photo" className="cursor-pointer bg-slate-600 text-gray-300 hover:bg-slate-500 py-2 px-3 border border-slate-500 rounded-md text-sm font-medium transition-colors">
                {photo ? 'Změnit fotku' : 'Vybrat fotku'}
            </label>
            {photo && <button type="button" onClick={() => setPhoto(undefined)} className="text-red-400 hover:text-red-300 text-sm">Odebrat</button>}
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={() => { onClose(); clearForm(); }} className="mr-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
            Zrušit
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
            Přidat vozidlo
          </button>
        </div>
      </form>
    </Modal>
  );
};