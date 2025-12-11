
import React, { useState, useRef, useEffect } from 'react';
import { User, WeightGoal, UserGoals } from '../types';
import { ChevronLeftIcon, FireIcon, MinusIcon, PlusIcon } from './Icons';

interface OnboardingScreenProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

// Configurações da régua
const RULER_STEP_WIDTH = 12; // Largura em pixels de cada passo (tick + gap)
// Aumentado a altura para garantir que os números caibam dentro do scroll area sem serem cortados
const RULER_HEIGHT = 90; 

// Componente de Seletor Deslizante (Rolar e Digitar) Refinado
const ScrollablePicker = ({ 
    min, 
    max, 
    value, 
    onChange, 
    unit, 
    label 
}: { 
    min: number, 
    max: number, 
    value: number, 
    onChange: (val: number) => void, 
    unit: string, 
    label: string 
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localValue, setLocalValue] = useState(value.toString());
    const [isFocused, setIsFocused] = useState(false);
    const isInternalScroll = useRef(false);
    const scrollTimeout = useRef<any>(null);

    // Array de valores para renderizar na régua
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    // Sincroniza input local quando value muda externamente (e não está focado)
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(value.toString());
        }
    }, [value, isFocused]);

    // Sincroniza Scroll com Value (apenas se não for scroll do usuário)
    useEffect(() => {
        if (isInternalScroll.current) return;

        if (scrollRef.current) {
            const index = value - min;
            // Centralizar: scrollLeft = (index * width)
            const targetScroll = index * RULER_STEP_WIDTH;
            
            scrollRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    }, [value, min]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        
        // Marca que estamos scrollando internamente para evitar loop do useEffect
        isInternalScroll.current = true;

        const scrollLeft = e.currentTarget.scrollLeft;
        // Calcula o índice baseado no scroll
        const index = Math.round(scrollLeft / RULER_STEP_WIDTH);
        const newValue = Math.min(Math.max(min + index, min), max);

        if (newValue !== value) {
            onChange(newValue);
            if (!isFocused) setLocalValue(newValue.toString());
        }

        // Detecta fim do scroll para snap e liberar flag
        scrollTimeout.current = setTimeout(() => {
            isInternalScroll.current = false;
            
            // Snap visual perfeito
            const exactScroll = (newValue - min) * RULER_STEP_WIDTH;
            if (Math.abs(scrollLeft - exactScroll) > 1) {
                 e.currentTarget.scrollTo({ left: exactScroll, behavior: 'smooth' });
            }
        }, 150);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;
        setLocalValue(val);
        if (val === '') return;
        const num = parseInt(val);
        if (!isNaN(num) && num >= min && num <= max) {
            onChange(num);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        let val = parseInt(localValue);
        if (isNaN(val) || localValue === '') val = min;
        if (val < min) val = min;
        if (val > max) val = max;
        onChange(val);
        setLocalValue(val.toString());
    };

    return (
        <div className="bg-zinc-900 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border border-zinc-800/50">
            {/* Label */}
            <div className="text-center mb-6">
                 <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{label}</span>
            </div>

            {/* Display Principal (Input + Botões) */}
            <div className="flex items-center justify-center gap-4 mb-8 relative z-20 px-2">
                <button 
                    onClick={() => {
                        const v = Math.max(min, value - 1);
                        onChange(v);
                        setLocalValue(v.toString());
                    }}
                    className="w-12 h-12 flex-shrink-0 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all border border-zinc-700/30"
                >
                    <MinusIcon className="w-5 h-5" />
                </button>

                {/* CORREÇÃO AQUI: Mudado para Flexbox com gap para evitar sobreposição */}
                <div className="flex items-baseline justify-center gap-1 min-w-[120px]">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onFocus={(e) => { setIsFocused(true); e.target.select(); }}
                        className="bg-transparent text-6xl sm:text-7xl font-black text-white text-center focus:outline-none p-0 m-0 border-none transition-colors selection:bg-emerald-500/30 w-auto"
                        style={{ width: `${Math.max(1, localValue.length)}ch`, maxWidth: '100%' }}
                    />
                    <span className="text-lg font-bold text-emerald-500 flex-shrink-0">{unit}</span>
                </div>

                <button 
                    onClick={() => {
                        const v = Math.min(max, value + 1);
                        onChange(v);
                        setLocalValue(v.toString());
                    }}
                    className="w-12 h-12 flex-shrink-0 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-all border border-zinc-700/30"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Régua Interativa */}
            <div className="relative w-full select-none" style={{ height: RULER_HEIGHT }}>
                 {/* Indicador Central */}
                 <div className="absolute left-1/2 top-0 w-1 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                 </div>

                 {/* Gradientes de Fade */}
                 <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-transparent z-10 pointer-events-none"></div>
                 <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-900 via-zinc-900/90 to-transparent z-10 pointer-events-none"></div>

                 {/* Container de Scroll */}
                 <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto no-scrollbar h-full flex items-start cursor-grab active:cursor-grabbing"
                    style={{ 
                        // Padding left/right de 50% da largura do container para centralizar o primeiro/ultimo item
                        paddingLeft: 'calc(50% - 1px)', 
                        paddingRight: 'calc(50% - 1px)' 
                    }}
                 >
                    <div className="flex h-full items-start pt-2">
                        {range.map((num) => {
                            const isMajor = num % 10 === 0;
                            const isMedium = num % 5 === 0;
                            
                            return (
                                <div 
                                    key={num} 
                                    className="flex flex-col items-center justify-start flex-shrink-0 relative"
                                    style={{ width: `${RULER_STEP_WIDTH}px`, height: '100%' }}
                                >
                                    {/* Tick Line */}
                                    <div 
                                        className={`w-[2px] rounded-full transition-colors duration-200 ${
                                            num === value 
                                            ? 'bg-transparent' // Esconde para não sobrepor o indicador principal
                                            : isMajor 
                                                ? 'bg-zinc-500 h-8' 
                                                : isMedium 
                                                    ? 'bg-zinc-600 h-5' 
                                                    : 'bg-zinc-700 h-3'
                                        }`} 
                                    />
                                    
                                    {/* Number - Renderizado ABSOLUTO RELATIVO AO TICK, não ao container global */}
                                    {isMajor && (
                                        <span className={`absolute top-10 text-[10px] font-medium transform -translate-x-1/2 transition-opacity ${num === value ? 'opacity-0' : 'text-zinc-600'}`}>
                                            {num}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </div>
            </div>
        </div>
    );
};

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
        className={`w-full p-6 rounded-[2.5rem] border text-left transition-all duration-300 active:scale-[0.98] ${
            selected 
            ? 'bg-emerald-500 text-black border-emerald-500 shadow-xl shadow-emerald-500/20' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`}
    >
        <div className="flex items-center justify-between">
            <p className="font-bold text-lg">{label}</p>
            <div className="text-3xl">{icon}</div>
        </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col p-6 text-white pb-10 bg-zinc-950 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      
      {/* Header / Progress */}
      <div className="flex items-center justify-between mt-4 mb-8">
          {step > 1 ? (
               <button onClick={prevStep} className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 active:scale-95 transition-transform border border-zinc-800 hover:bg-zinc-800">
                  <ChevronLeftIcon className="w-6 h-6" />
               </button>
          ) : (
              <div className="w-12" />
          )}
          <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-2 bg-zinc-800'}`} />
              ))}
          </div>
          <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500 pb-8">
        
        {step === 1 && (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black mb-3 tracking-tighter">Sobre Você</h2>
                    <p className="text-zinc-500 text-lg">Precisamos de alguns dados para personalizar sua dieta.</p>
                </div>

                <div className="space-y-6">
                    <ScrollablePicker 
                        label="Peso Atual" 
                        value={formData.weight || 70} 
                        onChange={(v) => handleChange('weight', v)}
                        min={30}
                        max={180}
                        unit="kg"
                    />

                    <ScrollablePicker 
                        label="Altura" 
                        value={formData.height || 170} 
                        onChange={(v) => handleChange('height', v)}
                        min={100}
                        max={230}
                        unit="cm"
                    />

                    <ScrollablePicker 
                        label="Idade" 
                        value={formData.age || 25} 
                        onChange={(v) => handleChange('age', v)}
                        min={10}
                        max={100}
                        unit="anos"
                    />

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={() => handleChange('gender', 'male')}
                            className={`p-5 rounded-[2rem] border font-bold text-md transition-all active:scale-[0.98] ${
                                formData.gender === 'male' 
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}
                        >
                            Masculino
                        </button>
                        <button
                            onClick={() => handleChange('gender', 'female')}
                            className={`p-5 rounded-[2rem] border font-bold text-md transition-all active:scale-[0.98] ${
                                formData.gender === 'female' 
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}
                        >
                            Feminino
                        </button>
                    </div>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black mb-3 tracking-tighter">Seu Objetivo</h2>
                    <p className="text-zinc-500 text-lg">O que você busca alcançar?</p>
                </div>

                <div className="space-y-4">
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
            <div className="space-y-8">
                 <div className="text-center mb-4">
                    <h2 className="text-4xl font-black mb-3 tracking-tighter">Sua Meta</h2>
                    <p className="text-zinc-500 text-lg">Calculada para o seu perfil.</p>
                </div>

                <div className="bg-zinc-900 p-10 rounded-[3rem] border border-zinc-800 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <FireIcon className="w-10 h-10" />
                    </div>
                    <label className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] mb-2">Calorias Diárias</label>
                    <div className="flex items-baseline gap-1 relative z-10">
                        <input 
                            type="number"
                            value={formData.goals?.calories}
                            onChange={(e) => handleGoalChange('calories', e.target.value)}
                            className="bg-transparent text-7xl font-black text-white text-center w-64 focus:outline-none"
                        />
                        <span className="text-zinc-500 font-bold text-xl absolute -right-8 top-4">kcal</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Distribuição de Macros</h3>
                    
                    {/* Macro Cards */}
                    {[
                        { key: 'protein', label: 'Proteína', icon: '🥩', color: 'bg-amber-500' },
                        { key: 'carbs', label: 'Carboidratos', icon: '🍚', color: 'bg-emerald-500' },
                        { key: 'fat', label: 'Gorduras', icon: '🥑', color: 'bg-blue-500' }
                    ].map((macro) => (
                         <div key={macro.key} className="bg-zinc-900/50 p-5 rounded-[2rem] border border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${macro.color}/10 flex items-center justify-center text-2xl`}>
                                    {macro.icon}
                                </div>
                                <span className="font-bold text-zinc-300 text-lg">{macro.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1 bg-zinc-800 rounded-xl px-4 py-2">
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
            className="w-full bg-white text-black font-extrabold text-xl py-6 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all mt-6 mb-4 hover:bg-zinc-200"
        >
            {step === 3 ? 'Finalizar Configuração' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
