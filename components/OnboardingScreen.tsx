
import React, { useState } from 'react';
import { User, WeightGoal, UserGoals } from '../types';
import { ChevronLeftIcon, FireIcon } from './Icons';

interface OnboardingScreenProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<User>({
    ...user,
    weight: user.weight || 70,
    height: user.height || 170,
    age: user.age || 25,
    gender: user.gender || 'male',
    weightGoal: 'maintain',
    goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 60,
        water: 2500
    }
  });

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

  const calculateMacros = () => {
      const weight = formData.weight || 70;
      const goal = formData.weightGoal;
      
      let factor = 29; // Maintain
      if (goal === 'lose_weight') factor = 24; 
      else if (goal === 'gain_muscle') factor = 32;

      const calories = Math.round(weight * factor);
      const protein = Math.round(weight * 2.0); 
      const fat = Math.round(weight * 0.9);
      const remainingCals = calories - (protein * 4) - (fat * 9);
      const carbs = Math.max(50, Math.round(remainingCals / 4));

      return { calories, protein, carbs, fat, water: Math.round(weight * 35) };
  };

  const nextStep = () => {
    if (step === 2) {
        const calculatedGoals = calculateMacros();
        setFormData(prev => ({
            ...prev,
            goals: calculatedGoals
        }));
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);
  const handleSubmit = () => onComplete(formData);

  const SelectCard = ({ selected, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`w-full p-6 rounded-[2rem] border text-left transition-all duration-300 active:scale-[0.98] ${
            selected 
            ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`}
    >
        <div className="flex items-center justify-between">
            <p className="font-bold text-lg">{label}</p>
            <div className="text-2xl">{icon}</div>
        </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col p-6 text-white pb-10 bg-zinc-950">
      
      {/* Header / Progress */}
      <div className="flex items-center justify-between mt-4 mb-8">
          {step > 1 ? (
               <button onClick={prevStep} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 active:scale-95 transition-transform border border-zinc-800">
                  <ChevronLeftIcon className="w-5 h-5" />
               </button>
          ) : (
              <div className="w-10" />
          )}
          <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`} />
              ))}
          </div>
          <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {step === 1 && (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Sobre Você</h2>
                    <p className="text-zinc-500">Dados para calibrar o algoritmo.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 focus-within:border-emerald-500 transition-all">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Peso (kg)</label>
                        <input 
                            type="number" 
                            value={formData.weight}
                            onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                            className="w-full bg-transparent text-4xl font-black text-white focus:outline-none"
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 focus-within:border-emerald-500 transition-all">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Altura (cm)</label>
                        <input 
                            type="number" 
                            value={formData.height}
                            onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                            className="w-full bg-transparent text-4xl font-black text-white focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 focus-within:border-emerald-500 transition-all">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Idade</label>
                    <input 
                        type="number" 
                        value={formData.age}
                        onChange={(e) => handleChange('age', parseFloat(e.target.value))}
                        className="w-full bg-transparent text-4xl font-black text-white focus:outline-none"
                        placeholder="0"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleChange('gender', 'male')}
                        className={`p-5 rounded-[2rem] border font-bold text-lg transition-all active:scale-[0.98] ${
                            formData.gender === 'male' 
                            ? 'bg-emerald-500 text-black border-emerald-500' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                    >
                        Masculino
                    </button>
                    <button
                        onClick={() => handleChange('gender', 'female')}
                        className={`p-5 rounded-[2rem] border font-bold text-lg transition-all active:scale-[0.98] ${
                            formData.gender === 'female' 
                            ? 'bg-emerald-500 text-black border-emerald-500' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                    >
                        Feminino
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Objetivo Principal</h2>
                    <p className="text-zinc-500">O que você deseja alcançar?</p>
                </div>

                <div className="space-y-3">
                    <SelectCard 
                        selected={formData.weightGoal === 'lose_weight'}
                        onClick={() => handleChange('weightGoal', 'lose_weight')}
                        label="Perder Peso"
                        icon="🔥"
                    />
                    <SelectCard 
                        selected={formData.weightGoal === 'maintain'}
                        onClick={() => handleChange('weightGoal', 'maintain')}
                        label="Manter Peso"
                        icon="⚖️"
                    />
                    <SelectCard 
                        selected={formData.weightGoal === 'gain_muscle'}
                        onClick={() => handleChange('weightGoal', 'gain_muscle')}
                        label="Ganhar Massa"
                        icon="💪"
                    />
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-6">
                 <div className="text-center mb-2">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Sua Meta Diária</h2>
                    <p className="text-zinc-500">Calculada para o seu perfil.</p>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col items-center justify-center text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 text-emerald-500">
                        <FireIcon className="w-8 h-8" />
                    </div>
                    <label className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-2">Calorias Recomendadas</label>
                    <div className="flex items-baseline gap-1 relative z-10">
                        <input 
                            type="number"
                            value={formData.goals?.calories}
                            onChange={(e) => handleGoalChange('calories', e.target.value)}
                            className="bg-transparent text-6xl font-black text-white text-center w-48 focus:outline-none"
                        />
                        <span className="text-zinc-500 font-bold text-lg">kcal</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Distribuição</h3>
                    
                    {/* Macro Cards */}
                    {[
                        { key: 'protein', label: 'Proteína', icon: '🥩' },
                        { key: 'carbs', label: 'Carbo', icon: '🍚' },
                        { key: 'fat', label: 'Gordura', icon: '🥑' }
                    ].map((macro) => (
                         <div key={macro.key} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-xl">{macro.icon}</span>
                                <span className="font-bold text-zinc-300">{macro.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="number" 
                                    value={(formData.goals as any)[macro.key]}
                                    onChange={(e) => handleGoalChange(macro.key as any, e.target.value)}
                                    className="w-16 bg-transparent text-right font-bold text-xl text-white focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500 font-bold">g</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex-1"></div>
        
        <button 
            onClick={step === 3 ? handleSubmit : nextStep}
            className="w-full bg-white text-black font-extrabold text-lg py-5 rounded-full shadow-xl shadow-white/10 active:scale-[0.98] transition-all mt-8 mb-4 hover:bg-zinc-200"
        >
            {step === 3 ? 'Finalizar' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
