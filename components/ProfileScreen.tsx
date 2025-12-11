
import React, { useState } from 'react';
import { User, UserGoals, ActivityLevel, WeightGoal } from '../types';
import { ChevronLeftIcon, SaveIcon, SunIcon, MoonIcon } from './Icons';

interface ProfileScreenProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onBack: () => void;
  onLogout: () => void;
  onClearHistory: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onSave, onBack, onLogout, onClearHistory, theme, onToggleTheme }) => {
  const [formData, setFormData] = useState<User>({
    ...user,
    goals: user.goals || {
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 70,
      water: 2500
    },
    weightGoal: user.weightGoal || 'maintain',
    activityLevel: user.activityLevel || 'moderately_active'
  });

  // Local state for button confirmation
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalChange = (field: keyof UserGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      goals: {
        ...prev.goals!,
        [field]: numValue
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleLogoutClick = () => {
    if (confirmLogout) {
      onLogout();
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000); 
    }
  };

  const handleClearHistoryClick = () => {
    if (confirmClear) {
      onClearHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col p-6 text-zinc-900 dark:text-white pb-24 animate-in fade-in slide-in-from-right-10 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 py-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-white active:scale-95 transition-transform"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Ajustes</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-emerald-500 text-white dark:text-black px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
        >
          <SaveIcon className="w-4 h-4" />
          Salvar
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Avatar & Basic Info */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-4xl font-bold mb-4">
             {formData.name.charAt(0).toUpperCase()}
          </div>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="bg-transparent text-center text-2xl font-bold border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:outline-none w-full max-w-[200px]"
          />
          <p className="text-zinc-500 text-sm">{formData.email}</p>
        </div>

        {/* Theme Switcher */}
         <section>
             <button 
                onClick={onToggleTheme}
                className="w-full bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group active:scale-[0.98] transition-all"
             >
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm">
                         {theme === 'dark' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                     </div>
                     <span className="font-bold">Modo Escuro</span>
                 </div>
                 <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
             </button>
         </section>

        {/* Physical Stats Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Dados Corporais</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Peso (kg)</label>
              <input 
                type="number" 
                value={formData.weight || ''}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                className="w-full bg-transparent text-xl font-bold text-zinc-900 dark:text-white focus:outline-none"
                placeholder="70"
              />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Altura (cm)</label>
              <input 
                type="number" 
                value={formData.height || ''}
                onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                className="w-full bg-transparent text-xl font-bold text-zinc-900 dark:text-white focus:outline-none"
                placeholder="175"
              />
            </div>
          </div>
        </section>

        {/* Activity Level */}
        <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nível de Atividade</h3>
            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                {['sedentary', 'lightly_active', 'moderately_active', 'very_active'].map((level) => {
                    const isSelected = formData.activityLevel === level;
                    const labels: Record<string, string> = {
                        sedentary: 'Sedentário',
                        lightly_active: 'Levemente Ativo',
                        moderately_active: 'Moderado',
                        very_active: 'Muito Ativo'
                    };
                    return (
                        <button
                            key={level}
                            onClick={() => handleChange('activityLevel', level)}
                            className={`w-full p-3 rounded-xl text-left font-bold text-sm transition-all flex justify-between items-center ${isSelected ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                        >
                            {labels[level]}
                            {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </button>
                    )
                })}
            </div>
        </section>

        {/* Nutrition Goals Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Metas Nutricionais</h3>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/50">
            {/* Calories */}
            <div className="p-4 flex justify-between items-center group hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔥</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">Calorias</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input 
                  type="number" 
                  value={formData.goals?.calories}
                  onChange={(e) => handleGoalChange('calories', e.target.value)}
                  className="w-16 bg-transparent text-right font-bold text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500">kcal</span>
              </div>
            </div>

            {/* Water */}
            <div className="p-4 flex justify-between items-center group hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">💧</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">Água</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input 
                  type="number" 
                  value={formData.goals?.water}
                  onChange={(e) => handleGoalChange('water', e.target.value)}
                  className="w-16 bg-transparent text-right font-bold text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500">ml</span>
              </div>
            </div>

            {/* Protein */}
            <div className="p-4 flex justify-between items-center group hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🥩</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">Proteína</span>
              </div>
              <div className="flex items-baseline gap-1">
                 <input 
                  type="number" 
                  value={formData.goals?.protein}
                  onChange={(e) => handleGoalChange('protein', e.target.value)}
                  className="w-12 bg-transparent text-right font-bold text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="p-4 flex justify-between items-center group hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                 <span className="text-xl">🍚</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">Carbo</span>
              </div>
              <div className="flex items-baseline gap-1">
                 <input 
                  type="number" 
                  value={formData.goals?.carbs}
                  onChange={(e) => handleGoalChange('carbs', e.target.value)}
                  className="w-12 bg-transparent text-right font-bold text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500">g</span>
              </div>
            </div>

             {/* Fat */}
             <div className="p-4 flex justify-between items-center group hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                 <span className="text-xl">🥑</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-200">Gordura</span>
              </div>
              <div className="flex items-baseline gap-1">
                 <input 
                  type="number" 
                  value={formData.goals?.fat}
                  onChange={(e) => handleGoalChange('fat', e.target.value)}
                  className="w-12 bg-transparent text-right font-bold text-zinc-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-500">g</span>
              </div>
            </div>

          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-3 pt-6">
          <button 
            type="button"
            onClick={handleClearHistoryClick}
            className={`w-full p-4 border rounded-3xl text-left font-medium transition-all flex justify-between items-center active:scale-[0.98] ${
              confirmClear 
              ? 'bg-red-500 border-red-500 text-white' 
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {confirmClear ? "Toque novamente" : "Limpar Histórico"}
          </button>
          
          <button 
            type="button"
            onClick={handleLogoutClick}
            className={`w-full p-4 border rounded-3xl text-left font-bold transition-all flex justify-between items-center active:scale-[0.98] ${
              confirmLogout
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10'
            }`}
          >
             {confirmLogout ? "Confirmar Saída" : "Sair da Conta"}
          </button>
        </section>

        <div className="text-center text-zinc-500 text-xs py-4">
            v2.1.0 • NutriVision
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
