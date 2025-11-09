import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { ExpenseCategory, Expense } from '../types';
import { CATEGORY_DETAILS } from '../constants';
import { CameraIcon, MicrophoneIcon } from './icons';
import { CameraModal } from './CameraModal';

// Fix: Add types for the Web Speech API to fix "Cannot find name 'SpeechRecognition'" errors.
// This provides the necessary type definitions for the experimental SpeechRecognition API,
// which are not included in standard TypeScript DOM typings.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognitionEvent extends Event {
    readonly results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            }
        }
    };
}

interface SpeechRecognition {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'vehicleId'>) => void;
  lastOdometer?: number;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense, lastOdometer }) => {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FUEL);
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [odometer, setOdometer] = useState<number | ''>('');
  const [liters, setLiters] = useState<number | ''>('');
  const [pricePerLiter, setPricePerLiter] = useState<number | ''>('');
  const [isCameraModalOpen, setCameraModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(ExpenseCategory.FUEL);
      setAmount('');
      setDescription('');
      setOdometer(lastOdometer && lastOdometer > 0 ? lastOdometer : '');
      setLiters('');
      setPricePerLiter('');
      setAttachment(undefined);
    }
  }, [isOpen, lastOdometer]);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'cs-CZ';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const numbers = transcript.replace(/\D/g, '');
        if (numbers) {
          setOdometer(parseInt(numbers, 10));
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert('Přístup k mikrofonu byl zamítnut. Povolte jej prosím v nastavení prohlížeče.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (liters && amount && !pricePerLiter) {
        const calculatedPrice = parseFloat((Number(amount) / Number(liters)).toFixed(2));
        if (!isNaN(calculatedPrice) && isFinite(calculatedPrice)) {
            setPricePerLiter(calculatedPrice);
        }
    }
  }, [liters, amount, pricePerLiter]);
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Příloha je příliš velká. Maximální velikost je 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
        alert('Rozpoznávání řeči není v tomto prohlížeči podporováno.');
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && category && amount) {
      const expenseData: Omit<Expense, 'id' | 'vehicleId'> = {
        date,
        category,
        amount: Number(amount),
        description,
        attachment,
      };
      if (category === ExpenseCategory.FUEL) {
        expenseData.odometer = odometer || undefined;
        expenseData.liters = liters || undefined;
        expenseData.pricePerLiter = pricePerLiter || undefined;
      }
      onAddExpense(expenseData);
      onClose();
    }
  };

  const handleCapture = (imageSrc: string) => {
      console.log('Captured image:', imageSrc);
      // Here you would typically send the image to a service for OCR
      // and then populate the form fields. For this demo, we'll just log it.
      alert('Funkce skenování není implementována. Data z účtenky by byla zde zpracována.');
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Přidat náklad">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium text-gray-400">Datum</label>
              <input
                type="date"
                id="expense-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-400">Částka (Kč)</label>
              <input
                type="number"
                id="expense-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expense-category" className="block text-sm font-medium text-gray-400">Kategorie</label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(CATEGORY_DETAILS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          
          {category === ExpenseCategory.FUEL && (
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
              <h4 className="font-semibold text-white">Údaje o tankování</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="expense-odometer" className="block text-sm font-medium text-gray-400">Tachometr (km)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      id="expense-odometer"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 pr-10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={isListening ? "Poslouchám..." : "123456"}
                    />
                     <button
                        type="button"
                        onClick={handleToggleListening}
                        className={`absolute inset-y-0 right-0 flex items-center px-3 rounded-r-md transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                        title="Zadat hlasem"
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="expense-liters" className="block text-sm font-medium text-gray-400">Litry (L)</label>
                  <input
                    type="number"
                    id="expense-liters"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="45.5"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="expense-price" className="block text-sm font-medium text-gray-400">Cena/L (Kč)</label>
                  <input
                    type="number"
                    id="expense-price"
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="38.90"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="expense-description" className="block text-sm font-medium text-gray-400">Popis (volitelné)</label>
            <textarea
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="např. Benzina, dálnice D1"
            />
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-400">Příloha (účtenka, faktura...)</label>
              <div className="mt-1 flex items-center space-x-4">
                {attachment && (
                    <img src={attachment} alt="Náhled přílohy" className="h-16 w-16 object-cover rounded-md" />
                )}
                <input id="expense-attachment" type="file" accept="image/*" onChange={handleAttachmentChange} className="hidden" />
                <label htmlFor="expense-attachment" className="cursor-pointer bg-slate-600 text-gray-300 hover:bg-slate-500 py-2 px-3 border border-slate-500 rounded-md text-sm font-medium transition-colors">
                    {attachment ? 'Změnit' : 'Vybrat soubor'}
                </label>
                {attachment && <button type="button" onClick={() => setAttachment(undefined)} className="text-red-400 hover:text-red-300 text-sm">Odebrat</button>}
              </div>
            </div>
          
          <div className="flex justify-between items-center pt-4">
             <button type="button" onClick={() => setCameraModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
                <CameraIcon className="w-5 h-5"/>
                <span>Skenovat</span>
             </button>
            <div className="flex">
              <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
                Zrušit
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                Přidat náklad
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <CameraModal 
        isOpen={isCameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
};