
import React, { useState, useEffect } from 'react';
import { User, WorkoutSession, WorkoutSplit } from '../types';
import { generateWorkoutRoutine } from '../services/geminiService';
import { storageService } from '../services/storage';
import { DumbbellIcon, SparklesIcon, ChevronLeftIcon, CheckCircleIcon, CircleIcon, HistoryIcon, CalendarIcon, SaveIcon } from './Icons';

interface WorkoutScreenProps {
  user: User;
  onBack: () => void;
  date: Date;
}

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ user, onBack, date }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [loading, setLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Creation State
  const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit>('ABC');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  
  // Active Workout State
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  
  // History State
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);

  // Init
  useEffect(() => {
    loadWorkouts();
  }, [user.id, date]); // Reload when date changes

  const loadWorkouts = async () => {
    try {
        const workouts = await storageService.getWorkouts(user.id);
        setWorkoutHistory(workouts);

        // Check if there is a workout for the SELECTED date
        const targetDate = new Date(date).setHours(0,0,0,0);
        
        const todayWorkout = workouts.find(w => {
            const wDate = new Date(w.timestamp).setHours(0,0,0,0);
            return wDate === targetDate;
        });

        // Only set as current if it's NOT completed, or if we want to allow editing completed ones today
        if (todayWorkout && !todayWorkout.completed) {
            setCurrentWorkout(todayWorkout);
        } else {
            setCurrentWorkout(null);
        }
    } catch (e) {
        console.error("Failed to load workouts", e);
    }
  };

  const muscleGroups = [
      "Peito", "Costas", "Pernas", "Ombros", 
      "Bíceps", "Tríceps", "Abdômen", "Glúteos"
  ];

  const splitLabels: Record<WorkoutSplit, string> = {
      'FullBody': 'Corpo Inteiro',
      'UpperLower': 'Superior / Inferior',
      'ABC': 'ABC (3 dias)',
      'ABCD': 'ABCD (4 dias)',
      'ABCDE': 'ABCDE (5 dias)'
  };

  const toggleMuscle = (muscle: string) => {
      setSelectedMuscles(prev => {
          if (prev.includes(muscle)) {
              return prev.filter(m => m !== muscle);
          }
          if (prev.length >= 3) {
              return prev;
          }
          return [...prev, muscle];
      });
  };

  const handleGenerate = async () => {
      if (selectedMuscles.length === 0) return;
      setLoading(true);

      const muscleString = selectedMuscles.join(', ');

      try {
          const routine = await generateWorkoutRoutine(user, selectedSplit, muscleString);
          
          // Use the selected date but keep current time
          const timestamp = new Date(date);
          const now = new Date();
          timestamp.setHours(now.getHours(), now.getMinutes());

          const newWorkout: WorkoutSession = {
              ...routine,
              id: Date.now().toString(),
              userId: user.id,
              timestamp: timestamp.getTime(),
              completed: false
          };

          await storageService.saveWorkout(newWorkout);
          setCurrentWorkout(newWorkout);
          setWorkoutHistory(prev => [newWorkout, ...prev]);
      } catch (e) {
          alert("Erro ao gerar treino. Tente novamente.");
      } finally {
          setLoading(false);
      }
  };

  const toggleExercise = async (index: number) => {
      if (!currentWorkout) return;

      const updatedExercises = [...currentWorkout.exercises];
      updatedExercises[index].completed = !updatedExercises[index].completed;
      
      const updatedWorkout = {
          ...currentWorkout,
          exercises: updatedExercises,
      };

      setCurrentWorkout(updatedWorkout);
      // Save progress to DB immediately (autosave)
      await storageService.saveWorkout(updatedWorkout);
  };

  const handleFinishWorkout = async () => {
      if (!currentWorkout || isFinishing) return;
      setIsFinishing(true);

      try {
          const completedWorkout = {
              ...currentWorkout,
              completed: true
          };

          await storageService.saveWorkout(completedWorkout);
          
          // Update local history
          setWorkoutHistory(prev => {
              const filtered = prev.filter(w => w.id !== completedWorkout.id);
              return [completedWorkout, ...filtered];
          });

          // Clear current active workout view
          setCurrentWorkout(null);
          
          // Switch to history tab to show it's done
          setActiveTab('history');
      } catch (e) {
          console.error("Erro ao finalizar treino", e);
      } finally {
          setIsFinishing(false);
      }
  };

  const isSelectedDateToday = new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
  const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col h-full bg-zinc-950 pb-32 no-scrollbar animate-in fade-in duration-300 min-h-screen text-white">
        
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-4 sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-transform">
                     <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">Treino Inteligente</h2>
            </div>
            
            <div className="flex bg-zinc-800 rounded-full p-1">
                <button 
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'today' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
                >
                    {isSelectedDateToday ? 'Hoje' : formattedDate}
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
                >
                    Histórico
                </button>
            </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
            
            {activeTab === 'today' && (
                <>
                    {/* Setup Phase - If no workout today */}
                    {!currentWorkout ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2 mt-4">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4 border border-emerald-500/20">
                                    <DumbbellIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black">
                                    {isSelectedDateToday ? "Vamos treinar o que hoje?" : `Treino para ${formattedDate}`}
                                </h3>
                                <p className="text-zinc-400 text-sm max-w-xs mx-auto">Selecione até 3 grupos musculares para um treino personalizado.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-2 mb-2 block">Estilo de Divisão</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(splitLabels) as WorkoutSplit[]).map(split => (
                                            <button
                                                key={split}
                                                onClick={() => setSelectedSplit(split)}
                                                className={`px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${selectedSplit === split ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                            >
                                                {splitLabels[split]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Foco Muscular</label>
                                        <span className={`text-xs font-bold ${selectedMuscles.length === 3 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                            {selectedMuscles.length}/3 selecionados
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {muscleGroups.map(group => {
                                            const isSelected = selectedMuscles.includes(group);
                                            return (
                                                <button
                                                    key={group}
                                                    onClick={() => toggleMuscle(group)}
                                                    className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all active:scale-[0.98] ${isSelected ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        {group}
                                                        {isSelected && <CheckCircleIcon className="w-4 h-4" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={selectedMuscles.length === 0 || loading}
                                className="w-full bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-lg py-4 rounded-full shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Gerar Treino {selectedMuscles.length > 0 && `(${selectedMuscles.length})`}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Active Workout View */
                        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <DumbbellIcon className="w-24 h-24 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">
                                        Treino do Dia
                                    </span>
                                    <h2 className="text-3xl font-black leading-none mb-1">{currentWorkout.focusGroup}</h2>
                                    <p className="text-zinc-500 font-medium text-sm">{splitLabels[currentWorkout.split] || currentWorkout.split}</p>
                                    
                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-white">{currentWorkout.exercises.filter(e => e.completed).length}/{currentWorkout.exercises.length}</span>
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold">Completos</span>
                                        </div>
                                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-500 transition-all duration-500" 
                                                style={{ width: `${(currentWorkout.exercises.filter(e => e.completed).length / currentWorkout.exercises.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {currentWorkout.exercises.map((exercise, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => toggleExercise(idx)}
                                        className={`p-5 rounded-3xl border transition-all cursor-pointer active:scale-[0.99] flex items-start gap-4 ${exercise.completed ? 'bg-zinc-900/40 border-emerald-500/30' : 'bg-zinc-900 border-zinc-800'}`}
                                    >
                                        <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${exercise.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600 text-transparent'}`}>
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-lg mb-1 ${exercise.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{exercise.name}</h4>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-black/30 px-2 py-1 rounded-md text-xs font-medium text-zinc-400">
                                                    {exercise.sets} séries
                                                </span>
                                                <span className="bg-black/30 px-2 py-1 rounded-md text-xs font-medium text-zinc-400">
                                                    {exercise.reps} repetições
                                                </span>
                                                <span className="bg-black/30 px-2 py-1 rounded-md text-xs font-medium text-zinc-400">
                                                    {exercise.rest} descanso
                                                </span>
                                            </div>
                                            
                                            {exercise.notes && (
                                                <p className="text-xs text-emerald-400/80 mt-2 font-medium bg-emerald-500/5 p-2 rounded-lg inline-block">
                                                    💡 {exercise.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleFinishWorkout}
                                disabled={isFinishing}
                                className="w-full bg-emerald-500 text-black font-extrabold text-lg py-4 rounded-full shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 mb-8"
                            >
                                {isFinishing ? (
                                    <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6" />
                                        Finalizar Treino
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {workoutHistory.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                             <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                             <p>Nenhum treino registrado.</p>
                        </div>
                    ) : (
                        workoutHistory.map(workout => (
                            <div key={workout.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalendarIcon className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs font-bold text-zinc-500 uppercase">
                                                {new Date(workout.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-white text-lg">{workout.focusGroup}</h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">{splitLabels[workout.split] || workout.split}</p>
                                    </div>
                                    {workout.completed && (
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                                            <CheckCircleIcon className="w-3 h-3" />
                                            Concluído
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    {workout.exercises.map((ex, i) => (
                                        <div key={i} className="flex justify-between text-sm text-zinc-400 border-b border-zinc-800/50 last:border-0 py-1">
                                            <span>{ex.name}</span>
                                            <span className="font-mono text-zinc-600">{ex.sets}x{ex.reps}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default WorkoutScreen;
