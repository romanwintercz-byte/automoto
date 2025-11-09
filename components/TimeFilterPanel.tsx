import React from 'react';

interface TimeFilterPanelProps {
    availableYears: string[];
    selectedYear: string;
    selectedMonth: string;
    onFilterChange: (year: string, month: string) => void;
}

export const TimeFilterPanel: React.FC<TimeFilterPanelProps> = ({ availableYears, selectedYear, selectedMonth, onFilterChange }) => {
    const months = [
        { value: '1', label: 'Leden' }, { value: '2', label: 'Únor' }, { value: '3', label: 'Březen' },
        { value: '4', label: 'Duben' }, { value: '5', label: 'Květen' }, { value: '6', label: 'Červen' },
        { value: '7', label: 'Červenec' }, { value: '8', label: 'Srpen' }, { value: '9', label: 'Září' },
        { value: '10', label: 'Říjen' }, { value: '11', label: 'Listopad' }, { value: '12', label: 'Prosinec' }
    ];

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = e.target.value;
        onFilterChange(newYear, 'all');
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange(selectedYear, e.target.value);
    };
    
    const handleReset = () => {
        onFilterChange('all', 'all');
    }

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-4">
            <h3 className="text-lg font-semibold text-white whitespace-nowrap">Zobrazit období</h3>
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
                <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Všechny roky</option>
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    disabled={selectedYear === 'all'}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="all">Celý rok</option>
                    {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors w-full sm:w-auto"
            >
                Resetovat
            </button>
        </div>
    );
};
