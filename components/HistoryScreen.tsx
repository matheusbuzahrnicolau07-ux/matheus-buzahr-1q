
import React from 'react';
import { AnalysisRecord } from '../types';
import { ChevronLeftIcon } from './Icons';

interface HistoryScreenProps {
  history: AnalysisRecord[];
  onBack: () => void;
  onSelect: (record: AnalysisRecord) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack, onSelect }) => {
  // Sort by newest first
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  // Group by date
  const groupedHistory = sortedHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, AnalysisRecord[]>);

  // GET LAST 10 DAYS
  const visibleDates = Object.keys(groupedHistory).slice(0, 10);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 pb-32 no-scrollbar animate-in fade-in duration-300">
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-100 transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Histórico</h2>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-wide">Últimos 10 dias</span>
      </div>

      <div className="p-4 flex-1">
        {sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-60">
             <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                 <span className="text-4xl">🍽️</span>
             </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Nada por aqui</h3>
            <p className="text-zinc-500 max-w-xs mx-auto">Suas refeições analisadas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleDates.map((date) => (
              <div key={date}>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 ml-2">{date}</h3>
                <div className="space-y-3">
                    {groupedHistory[date].map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="bg-white dark:bg-zinc-900 p-2 pr-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                           <img 
                                src={item.imageUrl} 
                                alt={item.foodName} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/18181b/52525b?text=Food';
                                }}
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1">
                            <h4 className="font-bold text-zinc-900 dark:text-white text-lg truncate mb-1">{item.foodName}</h4>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{Math.round(item.calories)} kcal</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-700"></span>
                                <span className="text-sm text-zinc-500">{item.weightGrams}g</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                                <div className="h-1 flex-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: `${(item.carbs / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                                </div>
                                <div className="h-1 flex-1 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                                     <div className="h-full bg-amber-500" style={{ width: `${(item.protein / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                                </div>
                                <div className="h-1 flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${(item.fat / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
              </div>
            ))}
            {visibleDates.length === 0 && sortedHistory.length > 0 && (
                <p className="text-center text-zinc-500 text-sm italic">Registros mais antigos ocultos.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
