import React from 'react';
import { MaintenanceTask } from '../types';
import { BellIcon, CheckIcon, TrashIcon, WrenchIcon, CalendarDaysIcon } from './icons';

interface UpcomingEventsPanelProps {
    tasks: (MaintenanceTask & { status: { text: string; color: string; priority: number } })[];
    onComplete: (task: MaintenanceTask) => void;
    onDelete: (taskId: string) => void;
}

export const UpcomingEventsPanel: React.FC<UpcomingEventsPanelProps> = ({ tasks, onComplete, onDelete }) => {

    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <BellIcon className="w-6 h-6 mr-2 text-yellow-400" />
                Nadcházející události
            </h3>
            <div className="space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-4 p-3 bg-slate-700/50 rounded-lg">
                        <div className="p-2 bg-slate-600 rounded-full">
                            {task.taskType === 'maintenance' 
                                ? <WrenchIcon className="w-5 h-5 text-gray-300" />
                                : <CalendarDaysIcon className="w-5 h-5 text-gray-300" />
                            }
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <p className="font-semibold text-white">{task.name}</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${task.status.color}`}>
                                    {task.status.text}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Termín: {new Date(task.nextDueDate).toLocaleDateString('cs-CZ')}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onComplete(task)} className="p-2 text-green-400 hover:bg-green-900/50 transition-colors rounded-full" title="Dokončit úkol">
                                <CheckIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => onDelete(task.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-full" title="Smazat úkol">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};