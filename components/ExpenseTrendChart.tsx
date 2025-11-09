import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORY_DETAILS } from '../constants';

interface ExpenseTrendChartProps {
  expenses: Expense[];
  selectedYear: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 p-2 border border-slate-600 rounded shadow-lg text-sm">
          <p className="label text-gray-300 font-bold">{label}</p>
          {payload.map((pld: any) => (
             pld.value > 0 && (
                <div key={pld.dataKey} style={{ color: pld.color }}>
                    {`${pld.name}: ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(pld.value)}`}
                </div>
             )
          ))}
        </div>
      );
    }
    return null;
};


export const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({ expenses, selectedYear }) => {
    const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>(Object.values(ExpenseCategory));

    const chartData = useMemo(() => {
        if (expenses.length === 0) return [];
        
        const monthlyData: { [key: string]: { [cat in ExpenseCategory]?: number } & { name: string } } = {};

        if (selectedYear !== 'all') {
            const year = parseInt(selectedYear, 10);
            for (let i = 0; i < 12; i++) {
                const date = new Date(year, i, 1);
                const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = { name: date.toLocaleString('cs-CZ', { month: 'short' }) };
            }
        } else {
            let lastExpenseDate = new Date(0);
            if (expenses.length > 0) {
                 lastExpenseDate = expenses.reduce((max, e) => new Date(e.date) > max ? new Date(e.date) : max, new Date(0));
            }
           
            const twelveMonthsAgoFromLast = new Date(lastExpenseDate);
            twelveMonthsAgoFromLast.setMonth(twelveMonthsAgoFromLast.getMonth() - 11);
            twelveMonthsAgoFromLast.setDate(1);

            for (let i = 0; i < 12; i++) {
                const date = new Date(twelveMonthsAgoFromLast);
                date.setMonth(date.getMonth() + i);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = { name: date.toLocaleString('cs-CZ', { month: 'short', year: '2-digit' }) };
            }
        }
        
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey][expense.category] = (monthlyData[monthKey][expense.category] || 0) + expense.amount;
            }
        });

        return Object.values(monthlyData);
    }, [expenses, selectedYear]);
    
    const toggleCategory = (category: ExpenseCategory) => {
        setSelectedCategories(prev => 
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    }

    if (expenses.length === 0) {
        return (
             <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Vývoj nákladů v čase</h3>
                 <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Pro zobrazení grafu nejsou k dispozici žádná data.
                 </div>
            </div>
        )
    }
    
    const colors: { [key in ExpenseCategory]: string } = {
        [ExpenseCategory.FUEL]: '#3b82f6',
        [ExpenseCategory.MAINTENANCE]: '#22c55e',
        [ExpenseCategory.INSURANCE]: '#eab308',
        [ExpenseCategory.OTHER]: '#a855f7',
    };

    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Vývoj nákladů v čase</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {Object.values(ExpenseCategory).map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full transition-all border-2 ${selectedCategories.includes(cat) ? 'text-white' : 'opacity-50 text-gray-300'}`}
                        style={{ 
                            backgroundColor: selectedCategories.includes(cat) ? colors[cat] : 'transparent',
                            borderColor: colors[cat]
                        }}
                    >
                        {CATEGORY_DETAILS[cat].name}
                    </button>
                ))}
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value: any) => `${Number(value)/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {selectedCategories.map(cat => (
                            <Line 
                                key={cat}
                                type="monotone" 
                                dataKey={cat} 
                                name={CATEGORY_DETAILS[cat].name}
                                stroke={colors[cat]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
