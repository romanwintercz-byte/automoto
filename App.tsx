import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Vehicle, Expense, ExpenseCategory, MaintenanceTask } from './types';
import { CATEGORY_DETAILS } from './constants';
import { AddVehicleModal } from './components/AddVehicleModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddMaintenanceModal } from './components/AddMaintenanceModal';
import { ExpenseChart } from './components/ExpenseChart';
import { CompleteMaintenanceModal } from './components/CompleteMaintenanceModal';
import { UpcomingEventsPanel } from './components/UpcomingEventsPanel';
import { Modal } from './components/Modal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { TimeFilterPanel } from './components/TimeFilterPanel';
import { InsuranceAlertBanner } from './components/InsuranceAlertBanner';
import { CarIcon, PlusIcon, TrashIcon, FuelIcon, MaintenanceIcon, InsuranceIcon, OtherIcon, WrenchIcon, TachometerIcon, ArchiveIcon, HistoryIcon, FilterIcon, CheckIcon, DownloadIcon, PaperclipIcon } from './components/icons';

type Filters = {
    categories: ExpenseCategory[];
    searchTerm: string;
}

const getMaintenanceStatus = (task: MaintenanceTask, currentOdometer: number) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(task.nextDueDate);

    const isOdometerOverdue = task.nextDueOdometer && currentOdometer > 0 && currentOdometer >= task.nextDueOdometer;
    const isDateOverdue = dueDate < today;

    if (isOdometerOverdue || isDateOverdue) {
        return { text: "Zpožděno", color: "bg-red-500", priority: 3 };
    }

    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const isOdometerSoon = task.nextDueOdometer && currentOdometer > 0 && (task.nextDueOdometer - currentOdometer <= 1000);
    const isDateSoon = daysUntilDue <= 30;

    if (isOdometerSoon || isDateSoon) { 
        return { text: `Zbývá ${daysUntilDue} dní`, color: "bg-yellow-500", priority: 2 }; 
    }
    
    return { text: "Naplánováno", color: "bg-gray-500", priority: 1 };
}

const App: React.FC = () => {
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [maintenanceTasks, setMaintenanceTasks] = useLocalStorage<MaintenanceTask[]>('maintenanceTasks', []);
  const [selectedVehicleId, setSelectedVehicleId] = useLocalStorage<string | null>('selectedVehicleId', null);
  
  const [isAddVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [isAddMaintenanceModalOpen, setAddMaintenanceModalOpen] = useState(false);
  const [isCompleteMaintenanceModalOpen, setCompleteMaintenanceModalOpen] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<MaintenanceTask | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({ categories: [], searchTerm: ''});
  const [timeFilter, setTimeFilter] = useState({ year: 'all', month: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [visibleInsuranceAlertTaskId, setVisibleInsuranceAlertTaskId] = useState<string | null>(null);
  
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);
  const maintenanceSectionRef = useRef<HTMLDivElement>(null);


  const { activeVehicles, archivedVehicles } = useMemo(() => {
    const active: Vehicle[] = [];
    const archived: Vehicle[] = [];
    vehicles.forEach(v => (v.isArchived ? archived : active).push(v));
    return { activeVehicles: active, archivedVehicles: archived };
  }, [vehicles]);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId && activeVehicles.length > 0 && (!localStorage.getItem('selectedVehicleId') || localStorage.getItem('selectedVehicleId') === 'null')) {
      setSelectedVehicleId(activeVehicles[0].id);
      return activeVehicles[0];
    }
    return activeVehicles.find(v => v.id === selectedVehicleId);
  }, [selectedVehicleId, activeVehicles, setSelectedVehicleId]);
  
  const vehicleExpenses = useMemo(() => {
    return expenses.filter(e => e.vehicleId === selectedVehicleId);
  }, [expenses, selectedVehicleId]);

  const availableYears = useMemo(() => {
    const years = new Set(vehicleExpenses.map(e => new Date(e.date).getFullYear().toString()));
    return Array.from(years).sort((a: string, b: string) => parseInt(b) - parseInt(a));
  }, [vehicleExpenses]);

  const filteredByTimeExpenses = useMemo(() => {
    if (timeFilter.year === 'all') {
        return vehicleExpenses;
    }
    return vehicleExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        const expenseYear = expenseDate.getFullYear().toString();
        const expenseMonth = (expenseDate.getMonth() + 1).toString();

        if (expenseYear !== timeFilter.year) {
            return false;
        }
        if (timeFilter.month !== 'all' && expenseMonth !== timeFilter.month) {
            return false;
        }
        return true;
    });
  }, [vehicleExpenses, timeFilter]);
  
  const currentOdometer = useMemo(() => {
      const odoReadings = vehicleExpenses
        .map(e => e.odometer)
        .filter((odo): odo is number => odo !== undefined && odo !== null);
      return odoReadings.length > 0 ? Math.max(...odoReadings) : 0;
  }, [vehicleExpenses]);

  const filteredExpenses = useMemo(() => {
    return filteredByTimeExpenses
      .filter(e => {
        if (filters.categories.length > 0 && !filters.categories.includes(e.category)) return false;
        if (filters.searchTerm && !e.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
        
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredByTimeExpenses, filters]);

  const vehicleMaintenanceTasks = useMemo(() => {
    return maintenanceTasks
        .filter(t => t.vehicleId === selectedVehicleId)
        .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [maintenanceTasks, selectedVehicleId]);
  
  const upcomingTasks = useMemo(() => {
    return vehicleMaintenanceTasks
        .map(task => ({ ...task, status: getMaintenanceStatus(task, currentOdometer) }))
        .filter(task => task.status.priority > 1)
        .sort((a, b) => b.status.priority - a.status.priority || new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [vehicleMaintenanceTasks, currentOdometer]);
  
  const vehicleAlerts = useMemo(() => {
    const alerts: Record<string, 'red' | 'yellow'> = {};
    activeVehicles.forEach(vehicle => {
        const tasks = maintenanceTasks.filter(t => t.vehicleId === vehicle.id);
        const expensesForOdo = expenses.filter(e => e.vehicleId === vehicle.id);
        const odo = Math.max(...expensesForOdo.map(e => e.odometer || 0));
        
        let highestPriority = 1;
        for (const task of tasks) {
            const status = getMaintenanceStatus(task, odo);
            if (status.priority > highestPriority) {
                highestPriority = status.priority;
            }
        }
        if (highestPriority === 3) alerts[vehicle.id] = 'red';
        else if (highestPriority === 2) alerts[vehicle.id] = 'yellow';
    });
    return alerts;
  }, [activeVehicles, maintenanceTasks, expenses]);
  
   useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskToAlert = vehicleMaintenanceTasks.find(task => {
            if (task.category !== ExpenseCategory.INSURANCE) return false;
            
            const dueDate = new Date(task.nextDueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            const isDismissed = localStorage.getItem(`dismissed-insurance-alert-${task.id}`) === 'true';

            return daysUntilDue >= 0 && daysUntilDue <= 60 && !isDismissed;
        });

        setVisibleInsuranceAlertTaskId(taskToAlert ? taskToAlert.id : null);

    }, [vehicleMaintenanceTasks, selectedVehicleId]);

    const insuranceTaskForAlert = useMemo(() => {
        if (!visibleInsuranceAlertTaskId) return null;
        return vehicleMaintenanceTasks.find(t => t.id === visibleInsuranceAlertTaskId);
    }, [visibleInsuranceAlertTaskId, vehicleMaintenanceTasks]);

    const handleDismissInsuranceAlert = (taskId: string) => {
        try {
            localStorage.setItem(`dismissed-insurance-alert-${taskId}`, 'true');
            setVisibleInsuranceAlertTaskId(null); // Hide it immediately
        } catch (error) {
            console.error("Could not save alert dismissal status:", error);
        }
    };

    const handleShowInsuranceTask = () => {
        maintenanceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle = { ...vehicleData, id: crypto.randomUUID(), isArchived: false };
    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    if (!selectedVehicleId) {
      setSelectedVehicleId(newVehicle.id);
    }
  };

  const handleUpdateVehicle = (vehicleId: string, updatedData: Partial<Omit<Vehicle, 'id'>>) => {
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, ...updatedData } : v));
  }

  const handleArchiveVehicle = (vehicleId: string) => {
    if (window.confirm("Opravdu chcete archivovat toto vozidlo? Stále budete moci zobrazit jeho data.")) {
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, isArchived: true } : v));
        if (selectedVehicleId === vehicleId) {
            setSelectedVehicleId(activeVehicles.length > 1 ? activeVehicles.find(v => v.id !== vehicleId)!.id : null);
        }
    }
  }
  
  const handleUnarchiveVehicle = (vehicleId: string) => {
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, isArchived: false } : v));
  }

  const handleDeleteVehiclePermanently = (vehicleId: string) => {
      if (window.confirm("VAROVÁNÍ: Opravdu chcete trvale smazat toto vozidlo a všechny jeho záznamy? Tuto akci nelze vrátit.")) {
          const newVehicles = vehicles.filter(v => v.id !== vehicleId);
          setVehicles(newVehicles);
          setExpenses(expenses.filter(e => e.vehicleId !== vehicleId));
          setMaintenanceTasks(tasks => tasks.filter(t => t.vehicleId !== vehicleId));

          if (selectedVehicleId === vehicleId) {
            const remainingActive = newVehicles.filter(v => !v.isArchived);
            setSelectedVehicleId(remainingActive.length > 0 ? remainingActive[0].id : null);
          }
      }
  }

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'vehicleId'>) => {
    if (selectedVehicleId) {
      const newExpense = { ...expenseData, id: crypto.randomUUID(), vehicleId: selectedVehicleId };
      setExpenses([...expenses, newExpense]);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
  };
  
  const handleAddMaintenanceTask = (taskData: Omit<MaintenanceTask, 'id' | 'vehicleId'>) => {
      if(selectedVehicleId) {
          const newTask = { ...taskData, id: crypto.randomUUID(), vehicleId: selectedVehicleId };
          setMaintenanceTasks([...maintenanceTasks, newTask]);
      }
  };

  const handleOpenCompleteMaintenanceModal = (task: MaintenanceTask) => {
      setTaskToComplete(task);
      setCompleteMaintenanceModalOpen(true);
  }

  const handleCompleteMaintenanceTask = (completionData: { taskId: string; date: string; amount: number; odometer: number | '' }) => {
    const { taskId, ...expenseData } = completionData;
    const task = maintenanceTasks.find(t => t.id === taskId);
    if (!task || !selectedVehicleId) return;

    const newExpense: Omit<Expense, 'id' | 'vehicleId'> = {
        date: expenseData.date,
        category: task.category,
        amount: expenseData.amount,
        description: task.name,
        odometer: expenseData.odometer || undefined
    };
    handleAddExpense(newExpense);

    if (task.intervalMonths || task.intervalOdometer) {
        let nextDueDate = new Date(task.nextDueDate);
        if (task.intervalMonths) {
            nextDueDate.setMonth(nextDueDate.getMonth() + task.intervalMonths);
        }
        const nextDueOdometer = (task.nextDueOdometer && task.intervalOdometer && expenseData.odometer) 
            ? expenseData.odometer + task.intervalOdometer 
            : '';
        const updatedTask = { ...task, nextDueDate: nextDueDate.toISOString().split('T')[0], nextDueOdometer: nextDueOdometer as number | '', };
        setMaintenanceTasks(maintenanceTasks.map(t => t.id === taskId ? updatedTask : t));
    } else {
        handleDeleteMaintenanceTask(taskId);
    }
    
    if (task.category === ExpenseCategory.INSURANCE) {
        try {
            localStorage.removeItem(`dismissed-insurance-alert-${taskId}`);
        } catch (error) {
            console.error("Could not remove alert dismissal status:", error);
        }
    }
  };

  const handleDeleteMaintenanceTask = (taskId: string) => {
      setMaintenanceTasks(maintenanceTasks.filter(t => t.id !== taskId));
  };
  
  const handleExportData = () => {
      const dataToExport = {
          vehicles,
          expenses,
          maintenanceTasks,
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `sledovani_nakladu_export_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };
  
  const handleVehiclePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedVehicleId) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("Fotka je příliš velká. Maximální velikost je 2 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdateVehicle(selectedVehicleId, { photo: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
  }
  
  const handleOpenAttachment = (attachment: string) => {
    setViewingAttachment(attachment);
    setImageViewerOpen(true);
  }

  const handleLoadSampleData = () => {
    const sampleVehicles: Vehicle[] = [
        { id: crypto.randomUUID(), name: 'Rodinné auto', make: 'Škoda', model: 'Octavia', year: 2020, isSample: true },
        { id: crypto.randomUUID(), name: 'Do města', make: 'Ford', model: 'Fiesta', year: 2015, isSample: true },
        { id: crypto.randomUUID(), name: 'Na dálnice', make: 'Volkswagen', model: 'Passat', year: 2022, isSample: true },
    ];

    let sampleExpenses: Expense[] = [];
    let sampleMaintenance: MaintenanceTask[] = [];

    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    sampleVehicles.forEach((vehicle, index) => {
        let odometer = [15000, 80000, 40000][index];
        
        for (let m = 0; m < 24; m++) {
            const date = new Date(twoYearsAgo);
            date.setMonth(date.getMonth() + m);

            // Fuel
            if (Math.random() > 0.3) {
                const liters = 35 + Math.random() * 15;
                const pricePerLiter = 34 + Math.random() * 5;
                const amount = liters * pricePerLiter;
                odometer += 500 + Math.random() * 400;
                sampleExpenses.push({
                    id: crypto.randomUUID(), vehicleId: vehicle.id, date: new Date(date.setDate(Math.random() * 28)).toISOString(),
                    category: ExpenseCategory.FUEL, amount: Math.round(amount), description: 'Běžné tankování',
                    liters: parseFloat(liters.toFixed(2)), pricePerLiter: parseFloat(pricePerLiter.toFixed(2)), odometer: Math.round(odometer),
                });
            }

            // Insurance once a year
            if (m === 6 || m === 18) {
                 sampleExpenses.push({
                    id: crypto.randomUUID(), vehicleId: vehicle.id, date: date.toISOString(),
                    category: ExpenseCategory.INSURANCE, amount: [6000, 4000, 8000][index] + Math.random() * 1000, description: 'Roční pojištění',
                });
            }
             // Maintenance
            if (m % 8 === 0 && m > 0) {
                 sampleExpenses.push({
                    id: crypto.randomUUID(), vehicleId: vehicle.id, date: date.toISOString(),
                    category: ExpenseCategory.MAINTENANCE, amount: 2000 + Math.random() * 3000, description: 'Servisní prohlídka',
                });
            }
        }
        
        // Maintenance Tasks
        const nextServiceDate = new Date();
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
        sampleMaintenance.push({
            id: crypto.randomUUID(), vehicleId: vehicle.id, name: 'Výměna oleje a filtrů', 
            nextDueDate: nextServiceDate.toISOString(), nextDueOdometer: Math.round(odometer + 15000), notes: 'Olej 5W-30', 
            intervalMonths: 12, intervalOdometer: 15000, taskType: 'maintenance', category: ExpenseCategory.MAINTENANCE
        });
        const nextInsuranceDate = new Date();
        nextInsuranceDate.setMonth(nextInsuranceDate.getMonth() + 1); // Set to next month for testing alert
        sampleMaintenance.push({
             id: crypto.randomUUID(), vehicleId: vehicle.id, name: 'Pojištění vozidla', 
             nextDueDate: nextInsuranceDate.toISOString(), nextDueOdometer: '', notes: '', 
             intervalMonths: 12, taskType: 'reminder', category: ExpenseCategory.INSURANCE
        });
    });
    
    setVehicles(prev => [...prev, ...sampleVehicles]);
    setExpenses(prev => [...prev, ...sampleExpenses]);
    setMaintenanceTasks(prev => [...prev, ...sampleMaintenance]);
    setSelectedVehicleId(sampleVehicles[0].id);
  }

  const totalExpenses = useMemo(() => filteredByTimeExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredByTimeExpenses]);
  
  const fuelStats = useMemo(() => {
    const fuelEntries = filteredByTimeExpenses
      .filter(e => e.category === ExpenseCategory.FUEL && e.odometer && e.liters)
      .sort((a, b) => a.odometer! - b.odometer!);

    if (fuelEntries.length < 2) return { avgConsumption: 0, avgCostPerKm: 0 };
    
    let totalLiters = 0;
    let totalDistance = 0;
    
    for (let i = 1; i < fuelEntries.length; i++) {
        const distance = fuelEntries[i].odometer! - fuelEntries[i-1].odometer!;
        if (distance > 0) {
            totalDistance += distance;
            totalLiters += fuelEntries[i-1].liters!;
        }
    }
    
    const totalFuelCost = filteredByTimeExpenses
        .filter(e => e.category === ExpenseCategory.FUEL)
        .reduce((sum, e) => sum + e.amount, 0);
    const overallDistance = fuelEntries[fuelEntries.length - 1].odometer! - fuelEntries[0].odometer!;

    const avgConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;
    const avgCostPerKm = overallDistance > 0 ? totalFuelCost / overallDistance : 0;

    return { avgConsumption: parseFloat(avgConsumption.toFixed(2)), avgCostPerKm: parseFloat(avgCostPerKm.toFixed(2)), };
  }, [filteredByTimeExpenses]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);
  
  const CategoryIcon: React.FC<{ category: ExpenseCategory, className?: string }> = ({ category, className }) => {
    switch (category) {
        case ExpenseCategory.FUEL: return <FuelIcon className={className} />;
        case ExpenseCategory.MAINTENANCE: return <MaintenanceIcon className={className} />;
        case ExpenseCategory.INSURANCE: return <InsuranceIcon className={className} />;
        case ExpenseCategory.OTHER: return <OtherIcon className={className} />;
        default: return null;
    }
  };
  
  const handleFilterChange = (filterName: keyof Filters, value: any) => { setFilters(prev => ({ ...prev, [filterName]: value })); }
  const handleCategoryFilterChange = (category: ExpenseCategory) => {
      setFilters(prev => {
          const newCategories = prev.categories.includes(category) ? prev.categories.filter(c => c !== category) : [...prev.categories, category];
          return { ...prev, categories: newCategories };
      });
  }
  
  const handleTimeFilterChange = (year: string, month: string) => {
    setTimeFilter({ year, month });
  };


  return (
    <div className="min-h-screen text-gray-200">
      <header className="bg-slate-900/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-slate-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Sledování nákladů</h1>
          <div className="flex items-center space-x-2">
             <button onClick={handleExportData} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors" title="Exportovat všechna data">
                <DownloadIcon className="w-6 h-6 text-white" />
             </button>
             <button onClick={() => setShowArchive(true)} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors" title="Zobrazit archiv">
              <HistoryIcon className="w-6 h-6 text-white" />
            </button>
            <select
              value={selectedVehicleId || ''}
              onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  setTimeFilter({ year: 'all', month: 'all' }); // Reset filter on vehicle change
              }}
              className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={activeVehicles.length === 0}
            >
              {activeVehicles.map(v => {
                const alert = vehicleAlerts[v.id];
                const alertEmoji = alert === 'red' ? '🔴' : alert === 'yellow' ? '🟡' : '';
                return <option key={v.id} value={v.id}>{v.name} {alertEmoji}</option>
              })}
            </select>
            <button onClick={() => setAddVehicleModalOpen(true)} className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {selectedVehicle ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col md:flex-row items-start">
                    <input type="file" accept="image/*" ref={vehiclePhotoInputRef} onChange={handleVehiclePhotoChange} className="hidden" />
                    <div className="w-full md:w-1/3 h-48 md:h-auto relative group">
                        {selectedVehicle.photo ? (
                            <img src={selectedVehicle.photo} alt={selectedVehicle.name} className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"/>
                        ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                                <CarIcon className="w-20 h-20 text-slate-500"/>
                            </div>
                        )}
                        <div onClick={() => vehiclePhotoInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                            <p className="text-white font-semibold">{selectedVehicle.photo ? 'Změnit fotku' : 'Nahrát fotku'}</p>
                        </div>
                    </div>
                    <div className="p-6 flex-1 flex justify-between items-start w-full">
                        <div>
                            <h2 className="text-3xl font-bold text-white">{selectedVehicle.name}</h2>
                            <p className="text-gray-400">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</p>
                            {currentOdometer > 0 && <p className="text-sm text-blue-400 mt-1">Stav tachometru: {currentOdometer.toLocaleString('cs-CZ')} km</p>}
                        </div>
                        {selectedVehicle.isSample ? (
                            <button onClick={() => handleDeleteVehiclePermanently(selectedVehicle.id)} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-900/40 hover:bg-red-900/60 rounded-md transition-colors" title="Smazat ukázková data">
                                <TrashIcon className="w-4 h-4"/>
                                <span>Smazat</span>
                            </button>
                        ) : (
                            <button onClick={() => handleArchiveVehicle(selectedVehicle.id)} className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/50 rounded-full transition-colors" title="Archivovat vozidlo">
                                <ArchiveIcon className="w-5 h-5"/>
                            </button>
                        )}
                    </div>
                </div>

                {insuranceTaskForAlert && (
                    <InsuranceAlertBanner 
                        task={insuranceTaskForAlert} 
                        vehicleName={selectedVehicle.name}
                        onDismiss={handleDismissInsuranceAlert}
                        onShowTask={handleShowInsuranceTask}
                    />
                )}

                <TimeFilterPanel
                    availableYears={availableYears}
                    selectedYear={timeFilter.year}
                    selectedMonth={timeFilter.month}
                    onFilterChange={handleTimeFilterChange}
                />

                <UpcomingEventsPanel 
                    tasks={upcomingTasks}
                    onComplete={handleOpenCompleteMaintenanceModal}
                    onDelete={handleDeleteMaintenanceTask}
                />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-2">Celkové náklady</h3>
                    <p className="text-4xl font-bold text-blue-400">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center"><TachometerIcon className="w-6 h-6 mr-2"/> Statistiky paliva</h3>
                    <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-lg"><span className="text-gray-400">Ø Spotřeba:</span> <span className="font-bold text-white">{fuelStats.avgConsumption > 0 ? `${fuelStats.avgConsumption} L/100km` : '-'}</span></div>
                        <div className="flex justify-between text-lg"><span className="text-gray-400">Ø Cena/km:</span> <span className="font-bold text-white">{fuelStats.avgCostPerKm > 0 ? formatCurrency(fuelStats.avgCostPerKm) : '-'}</span></div>
                    </div>
                </div>
              </div>
              
              <ExpenseChart expenses={filteredByTimeExpenses} />
              
              <div ref={maintenanceSectionRef} className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center"><WrenchIcon className="w-6 h-6 mr-2"/> Všechny plány a připomínky</h3>
                  <button onClick={() => setAddMaintenanceModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Naplánovat</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {vehicleMaintenanceTasks.length > 0 ? (
                    vehicleMaintenanceTasks.map(task => {
                        const status = getMaintenanceStatus(task, currentOdometer);
                        return (
                            <div key={task.id} className="flex items-center space-x-4 p-3 bg-slate-700/50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <p className="font-semibold text-white">{task.name}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${status.color}`}>{status.text}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Termín: {new Date(task.nextDueDate).toLocaleDateString('cs-CZ')}
                                        {task.taskType === 'maintenance' && task.nextDueOdometer ? ` / ${task.nextDueOdometer.toLocaleString('cs-CZ')} km` : ''}
                                    </p>
                                    {task.notes && <p className="text-sm text-gray-400 italic mt-1">"{task.notes}"</p>}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenCompleteMaintenanceModal(task)} className="p-2 text-green-400 hover:bg-green-900/50 transition-colors rounded-full" title="Dokončit úkol">
                                        <CheckIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDeleteMaintenanceTask(task.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-full" title="Smazat úkol">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                  ) : (
                    <p className="text-gray-400 text-center py-4">Žádná plánovaná údržba.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">Historie nákladů</h3>
                  <button onClick={() => setAddExpenseModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Přidat</span>
                  </button>
                </div>
                {/* Filters */}
                <div className="mb-4">
                    <button onClick={() => setShowFilters(!showFilters)} className="w-full flex justify-between items-center p-2 bg-slate-700 rounded-md text-gray-300 hover:bg-slate-600">
                        <div className="flex items-center space-x-2">
                           <FilterIcon className="w-5 h-5" />
                           <span>Další filtry</span>
                        </div>
                        <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showFilters && (
                        <div className="p-4 bg-slate-700/50 rounded-b-lg space-y-4 mt-1">
                            <input type="text" placeholder="Hledat v popisu..." value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-400">Kategorie:</p>
                                <div className="flex flex-wrap gap-2">
                                {Object.entries(CATEGORY_DETAILS).map(([key, { name }]) => (
                                    <button key={key} onClick={() => handleCategoryFilterChange(key as ExpenseCategory)} className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.categories.includes(key as ExpenseCategory) ? 'bg-blue-600 text-white' : 'bg-slate-600 text-gray-300 hover:bg-slate-500'}`}>
                                        {name}
                                    </button>
                                ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 max-h-[80vh] lg:max-h-[105vh] overflow-y-auto pr-2">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => (
                      <div key={expense.id} className="flex items-start space-x-4 p-3 bg-slate-700/50 rounded-lg">
                        <div className={`mt-1 p-2 rounded-full ${CATEGORY_DETAILS[expense.category].color}`}>
                          <CategoryIcon category={expense.category} className="w-6 h-6 text-white"/>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{CATEGORY_DETAILS[expense.category].name}</p>
                          <p className="text-sm text-gray-400">{new Date(expense.date).toLocaleDateString('cs-CZ')}</p>
                          {expense.category === ExpenseCategory.FUEL && (
                            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                {expense.odometer && <span>{expense.odometer.toLocaleString('cs-CZ')} km</span>}
                                {expense.liters && <span> • {expense.liters} L @ {formatCurrency(expense.pricePerLiter || 0)}/L</span>}
                            </div>
                          )}
                          {expense.description && <p className="text-sm text-gray-400 italic mt-1">"{expense.description}"</p>}
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className="font-bold text-lg text-white">{formatCurrency(expense.amount)}</p>
                            <div className="flex items-center space-x-1 mt-1">
                                {expense.attachment && (
                                    <button onClick={() => handleOpenAttachment(expense.attachment!)} className="p-1 text-gray-400 hover:text-blue-400 transition-colors" title="Zobrazit přílohu">
                                        <PaperclipIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">Žádné náklady neodpovídají filtrům.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-slate-800 rounded-lg shadow-lg">
            <CarIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Vítejte!</h2>
            <p className="text-gray-400 mt-2 mb-6">Začněte tím, že přidáte své první vozidlo, nebo si vyzkoušejte aplikaci s ukázkovými daty.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button onClick={() => setAddVehicleModalOpen(true)} className="flex items-center space-x-2 w-full sm:w-auto justify-center px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                  <PlusIcon className="w-5 h-5" />
                  <span>Přidat vozidlo</span>
                </button>
                <button onClick={handleLoadSampleData} className="w-full sm:w-auto px-6 py-3 font-semibold text-gray-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                  Načíst ukázková data
                </button>
            </div>
          </div>
        )}
      </main>

      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setAddVehicleModalOpen(false)}
        onAddVehicle={handleAddVehicle}
      />
      
      {selectedVehicle && (
        <>
            <AddExpenseModal
                isOpen={isAddExpenseModalOpen}
                onClose={() => setAddExpenseModalOpen(false)}
                onAddExpense={handleAddExpense}
                lastOdometer={currentOdometer}
            />
            <AddMaintenanceModal 
                isOpen={isAddMaintenanceModalOpen}
                onClose={() => setAddMaintenanceModalOpen(false)}
                onAddTask={handleAddMaintenanceTask}
            />
            <CompleteMaintenanceModal
                isOpen={isCompleteMaintenanceModalOpen}
                onClose={() => setCompleteMaintenanceModalOpen(false)}
                task={taskToComplete}
                currentOdometer={currentOdometer}
                onComplete={handleCompleteMaintenanceTask}
            />
        </>
      )}
       <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageSrc={viewingAttachment}
        />
      <Modal isOpen={showArchive} onClose={() => setShowArchive(false)} title="Archiv vozidel">
         <div className="space-y-4">
            {archivedVehicles.length > 0 ? (
                archivedVehicles.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                        <div>
                            <p className="font-semibold text-white">{v.name}</p>
                            <p className="text-sm text-gray-400">{v.make} {v.model}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleUnarchiveVehicle(v.id)} className="p-2 text-green-400 hover:bg-green-900/50 rounded-full transition-colors" title="Obnovit vozidlo">
                                <HistoryIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteVehiclePermanently(v.id)} className="p-2 text-red-400 hover:bg-red-900/50 rounded-full transition-colors" title="Trvale smazat">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 text-center py-6">Archiv je prázdný.</p>
            )}
         </div>
      </Modal>
    </div>
  );
};

export default App;