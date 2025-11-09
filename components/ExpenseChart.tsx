import React, { useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORY_DETAILS } from '../constants';

interface ExpenseChartProps {
  expenses: Expense[];
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = (data.percent * 100).toFixed(1);
      return (
        <div className="bg-slate-700 p-2 border border-slate-600 rounded shadow-lg">
          <p className="label text-gray-300 font-bold">{`${data.name}`}</p>
          <p className="intro text-white">{`Částka: ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(data.value)}`}</p>
          <p className="text-gray-400">{`Podíl: ${percent}%`}</p>
        </div>
      );
    }
  
    return null;
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses }) => {
  const chartData = useMemo(() => {
    const dataByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return Object.entries(dataByCategory)
        .map(([category, amount]) => ({
            name: CATEGORY_DETAILS[category as ExpenseCategory].name,
            amount: amount,
        }))
        .sort((a, b) => Number(b.amount) - Number(a.amount));

  }, [expenses]);

  const categoryColors: { [key: string]: string } = {
    'Pohonné hmoty': '#3b82f6',
    'Údržba': '#22c55e',
    'Pojištění': '#eab308',
    'Ostatní': '#a855f7',
  };

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Náklady dle kategorie</h3>
      <div style={{ width: '100%', height: 300 }}>
        {expenses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
                Pro zobrazení grafu nejsou k dispozici žádná data.
            </div>
        ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="name"
                >
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={categoryColors[entry.name] || '#8884d8'} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{fontSize: '14px'}}/>
              </PieChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};