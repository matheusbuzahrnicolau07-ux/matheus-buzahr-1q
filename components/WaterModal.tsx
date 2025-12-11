
import React, { useState } from 'react';
import { DropletIcon, XMarkIcon, PlusIcon, MinusIcon } from './Icons';

interface WaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: number;
  goal: number;
  onAdd: (amount: number) => void;
}

const WaterModal: React.FC<WaterModalProps> = ({ isOpen, onClose, current, goal, onAdd }) => {
  const [customAmount, setCustomAmount] = useState<string>('');

  if (!isOpen) return null;

  const presets = [150, 250, 500];

  const handleCustomAdd = () => {
      const amount = parseInt(customAmount);
      if (amount > 0) {
          onAdd(amount);
          setCustomAmount('');
      }
  };

  const handleRemove = () => {
     onAdd(-250); 
  };

  const percentage = Math.min(100, (current / goal) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 border border-zinc-200 dark:border-zinc-800">
            
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <DropletIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-none">Hidratação</h2>
                        <p className="text-xs text-zinc-500 font-medium mt-1">Registre seu consumo</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 active:scale-90 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center mb-8 relative">
                 <div className="w-48 h-48 rounded-full border-[6px] border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center relative overflow-hidden bg-white dark:bg-zinc-950 shadow-inner">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 ease-out"
                        style={{ height: `${percentage}%`, opacity: 0.9 }}
                      ></div>
                      
                      <div className="relative z-10 text-center mix-blend-difference text-white">
                          <span className="block text-5xl font-black tracking-tighter">{current}</span>
                          <span className="text-xs font-bold uppercase tracking-widest opacity-80">/ {goal} ml</span>
                      </div>
                 </div>
                 <p className="mt-6 text-sm font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 py-2 px-4 rounded-full">
                    {percentage >= 100 ? "Meta atingida! 🎉" : `${Math.round(goal - current)}ml restantes`}
                 </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {presets.map(amount => (
                    <button
                        key={amount}
                        onClick={() => onAdd(amount)}
                        className="group bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl p-3 flex flex-col items-center justify-center transition-all active:scale-95"
                    >
                        <span className="text-lg font-black text-zinc-700 dark:text-white group-hover:text-blue-500 transition-colors">+{amount}</span>
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-blue-400 uppercase">ml</span>
                    </button>
                ))}
            </div>

            <div className="flex items-stretch gap-3 h-14">
                 <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center px-2 relative overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                     <input 
                        type="number" 
                        placeholder="Outro..." 
                        className="bg-transparent w-full h-full px-3 font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none text-lg appearance-none"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                        autoComplete="off"
                        inputMode="numeric"
                     />
                     <span className="text-zinc-400 font-bold pr-3 text-xs uppercase">ml</span>
                 </div>
                 
                 <button 
                    onClick={handleCustomAdd} 
                    disabled={!customAmount}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm shrink-0 ${
                        customAmount 
                        ? 'bg-blue-500 text-white shadow-blue-500/30' 
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                    }`}
                 >
                     <PlusIcon className="w-6 h-6" />
                 </button>

                 <button 
                    onClick={handleRemove}
                    className="aspect-square bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center text-red-500 active:scale-90 transition-all shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    title="Remover 250ml"
                 >
                     <MinusIcon className="w-6 h-6" />
                 </button>
            </div>

        </div>
    </div>
  );
};

export default WaterModal;
