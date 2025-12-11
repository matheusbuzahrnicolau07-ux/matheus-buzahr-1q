
import React, { useState, useEffect } from 'react';
import { AnalysisRecord } from '../types';
import { ChevronLeftIcon, CalendarIcon } from './Icons';

interface HistoryScreenProps {
  history: AnalysisRecord[];
  onBack: () => void;
  onSelect: (record: AnalysisRecord) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack, onSelect }) => {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');

  // 1. Agrupar histórico por data
  const groupedHistory = history.reduce((groups, item) => {
    // Cria uma chave de data YYYY-MM-DD para ordenação correta
    const dateObj = new Date(item.timestamp);
    const dateKey = dateObj.toLocaleDateString('pt-BR'); // "dd/mm/aaaa"
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        items: [],
        timestamp: dateObj.getTime() // Guarda timestamp para ordenar as datas
      };
    }
    groups[dateKey].items.push(item);
    return groups;
  }, {} as Record<string, { items: AnalysisRecord[], timestamp: number }>);

  // 2. Obter lista de datas ordenadas (mais recente primeiro)
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
    return groupedHistory[b].timestamp - groupedHistory[a].timestamp;
  });

  // 3. Selecionar a data mais recente ao iniciar
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDateKey) {
      setSelectedDateKey(sortedDates[0]);
    }
  }, [sortedDates, selectedDateKey]);

  const currentItems = selectedDateKey ? groupedHistory[selectedDateKey]?.items || [] : [];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 pb-32 no-scrollbar animate-in fade-in duration-300">
      {/* Header - CORRIGIDO PADDING TOP NOTCH */}
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-900 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 flex items-center justify-center text-zinc-800 dark:text-zinc-100 transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight leading-none">Histórico</h2>
            <p className="text-xs text-zinc-500 font-medium">Selecione o dia para ver detalhes</p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-60">
             <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                 <span className="text-4xl">🍽️</span>
             </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Nada por aqui</h3>
            <p className="text-zinc-500 max-w-xs mx-auto">Suas refeições analisadas aparecerão aqui.</p>
          </div>
      ) : (
          <>
            {/* Seletor de Datas Horizontal */}
            <div className="pt-4 pb-2 px-4 overflow-x-auto no-scrollbar flex gap-2 sticky top-[calc(env(safe-area-inset-top)+73px)] z-10 bg-gray-50 dark:bg-zinc-950/95 backdrop-blur-sm">
                {sortedDates.map((date) => {
                    const isSelected = selectedDateKey === date;
                    // Formatar data para "Seg, 12 Out"
                    const dateParts = date.split('/'); // dd, mm, yyyy
                    // Nota: Date() requer mm/dd/yyyy ou yyyy-mm-dd
                    const dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
                    
                    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                    const dayNum = dateObj.getDate();
                    
                    return (
                        <button
                            key={date}
                            onClick={() => setSelectedDateKey(date)}
                            className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-2xl border transition-all active:scale-95 ${
                                isSelected 
                                ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-black shadow-lg' 
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase">{dayName}</span>
                            <span className="text-xl font-black">{dayNum}</span>
                        </button>
                    );
                })}
            </div>

            {/* Lista de Refeições do Dia Selecionado */}
            <div className="p-4 space-y-3 min-h-[50vh]">
                <div className="flex items-center gap-2 mb-2 px-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                        Refeições de {selectedDateKey}
                    </span>
                </div>

                {currentItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="bg-white dark:bg-zinc-900 p-2 pr-4 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer group"
                    >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                           <img 
                                src={item.imageUrl} 
                                alt={item.foodName} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/18181b/52525b?text=Food';
                                }}
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-zinc-900 dark:text-white text-base truncate mb-1">{item.foodName}</h4>
                                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full uppercase">
                                    {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.round(item.calories)} kcal</span>
                                <span className="text-xs text-zinc-400">•</span>
                                <span className="text-xs text-zinc-500 font-medium">{item.weightGrams}g</span>
                            </div>

                            {/* Macro mini bars */}
                            <div className="flex gap-1 h-1.5 w-full max-w-[120px]">
                                <div className="bg-emerald-500 rounded-full" style={{ width: `${(item.carbs / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                                <div className="bg-amber-500 rounded-full" style={{ width: `${(item.protein / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                                <div className="bg-blue-500 rounded-full" style={{ width: `${(item.fat / (item.carbs + item.protein + item.fat)) * 100}%`}}></div>
                            </div>
                        </div>
                        
                        <div className="text-zinc-300 dark:text-zinc-700">
                             <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                        </div>
                    </div>
                ))}
            </div>
          </>
      )}
    </div>
  );
};

export default HistoryScreen;
