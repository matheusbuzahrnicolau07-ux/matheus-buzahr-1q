
import React, { useState, useEffect } from 'react';
import { NutritionData, MealType } from '../types';
import { SaveIcon, ChevronLeftIcon, FireIcon, PencilIcon, SparklesIcon, TrashIcon } from './Icons';

interface AnalysisResultProps {
  data: NutritionData;
  imageUrl: string;
  onSave: (data: NutritionData, mealType: MealType) => void;
  onCancel: () => void;
  initialMealType?: MealType;
  onDelete: (id: string) => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, imageUrl, onSave, onCancel, initialMealType, onDelete }) => {
  const [editableData, setEditableData] = useState<NutritionData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType || 'snack');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if we are in "Edit Mode" (existing record)
  const isExistingRecord = !!(data as any).id;

  // Update editable data when multiplier changes
  useEffect(() => {
    if (portionMultiplier !== 1) {
      setEditableData(prev => ({
        ...prev,
        weightGrams: Math.round(data.weightGrams * portionMultiplier),
        calories: Math.round(data.calories * portionMultiplier),
        carbs: Math.round(data.carbs * portionMultiplier),
        protein: Math.round(data.protein * portionMultiplier),
        fat: Math.round(data.fat * portionMultiplier),
      }));
    } else {
        // Reset to original if 1x
        setEditableData(prev => ({
            ...prev,
            weightGrams: data.weightGrams,
            calories: data.calories,
            carbs: data.carbs,
            protein: data.protein,
            fat: data.fat,
        }));
    }
  }, [portionMultiplier, data]);

  const handleInputChange = (field: keyof NutritionData, value: string) => {
    const numValue = field === 'foodName' ? value : parseFloat(value) || 0;
    setEditableData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    onSave(editableData, selectedMealType);
  };

  const handleDelete = () => {
      // If the record has an ID (it exists in history), we call delete
      // If it's a new record (not saved yet), we just cancel
      if ((data as any).id) {
          onDelete((data as any).id);
      } else {
          onCancel();
      }
  };

  const portions = [0.5, 1, 1.5, 2];

  const mealOptions: { id: MealType; label: string; icon: string }[] = [
      { id: 'breakfast', label: 'Café', icon: '☕' },
      { id: 'lunch', label: 'Almoço', icon: '🍽️' },
      { id: 'dinner', label: 'Jantar', icon: '🌙' },
      { id: 'snack', label: 'Lanche', icon: '🍎' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-300">
       
      {/* Header Image Area */}
      <div className="relative h-72 w-full shrink-0">
        <img src={imageUrl} alt="Food" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-white dark:to-zinc-950"></div>
        
        {/* Top Bar - CORRIGIDO PADDING TOP NOTCH */}
        <div className="absolute top-0 left-0 w-full pt-[calc(env(safe-area-inset-top)+1rem)] px-4 pb-4 flex justify-between items-center z-50 no-print">
            <button 
                onClick={onCancel} 
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform cursor-pointer hover:bg-black/60"
                aria-label="Voltar"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform hover:bg-red-500/50 cursor-pointer"
                 >
                    <TrashIcon className="w-5 h-5 text-white" />
                 </button>
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal/Overlay */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Excluir registro?</h3>
                  <p className="text-zinc-500 mb-6">Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">Cancelar</button>
                      <button onClick={handleDelete} className="flex-1 py-3 font-bold text-white bg-red-500 rounded-2xl">Excluir</button>
                  </div>
              </div>
          </div>
      )}

      {/* Content Body - Overlapping Image */}
      <div className="px-5 -mt-12 relative z-20 space-y-6">
        
        {/* Title and Edit Row */}
        <div>
            <div className="flex justify-between items-start">
                 {isEditing ? (
                    <input
                      type="text"
                      value={editableData.foodName as string}
                      onChange={(e) => handleInputChange('foodName', e.target.value)}
                      className="w-full bg-transparent text-2xl font-bold border-b border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:outline-none text-zinc-900 dark:text-white"
                      placeholder="Nome do alimento"
                    />
                 ) : (
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">{editableData.foodName}</h1>
                 )}
                 <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-full px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 ml-4 shrink-0 shadow-sm"
                 >
                    {isEditing ? 'Cancelar' : (
                        <>
                            {editableData.weightGrams}g
                            <PencilIcon className="w-3 h-3" />
                        </>
                    )}
                 </button>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 flex items-center gap-2">
                 <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 {editableData.confidence < 70 && (
                     <span className="text-orange-500 dark:text-orange-400 text-xs flex items-center gap-1">• Baixa confiança</span>
                 )}
            </div>
        </div>

        {/* Meal Type Selection - NEW FEATURE */}
        <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Qual refeição?</h3>
            <div className="grid grid-cols-4 gap-2">
                {mealOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedMealType(option.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                            selectedMealType === option.id
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <span className="text-xl mb-1">{option.icon}</span>
                        <span className="text-[10px] font-bold">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Portion Control */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-500 pl-2">Porção:</span>
            <div className="flex gap-1">
                {portions.map((p) => (
                    <button
                        key={p}
                        onClick={() => setPortionMultiplier(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            portionMultiplier === p 
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' 
                            : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {p}x
                    </button>
                ))}
            </div>
        </div>

        {/* Calories Main Display */}
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                 <FireIcon className="w-6 h-6 text-orange-500" />
             </div>
             <div>
                 <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-0.5">Calorias</p>
                 <div className="flex items-baseline gap-1">
                      {isEditing ? (
                         <input
                             type="number"
                             value={editableData.calories}
                             onChange={(e) => handleInputChange('calories', e.target.value)}
                             className="w-24 bg-transparent text-4xl font-extrabold text-zinc-900 dark:text-white border-b border-zinc-300 dark:border-zinc-700 focus:outline-none"
                         />
                      ) : (
                         <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">{Math.round(editableData.calories)}</span>
                      )}
                 </div>
             </div>
        </div>

        {/* Macros Row */}
        <div className="grid grid-cols-3 gap-3">
            {/* Protein */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                     <span className="text-2xl">🥩</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                     <span className="text-xs font-semibold text-zinc-400">Proteína</span>
                </div>
                <div className="flex items-baseline gap-1">
                    {isEditing ? (
                         <input
                             type="number"
                             value={editableData.protein}
                             onChange={(e) => handleInputChange('protein', e.target.value)}
                             className="w-12 bg-transparent text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-300 dark:border-zinc-700 focus:outline-none"
                         />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(editableData.protein)}</span>
                    )}
                    <span className="text-xs text-zinc-500 font-medium">g</span>
                </div>
            </div>

            {/* Carbs */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group shadow-sm">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                     <span className="text-2xl">🍚</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                     <span className="text-xs font-semibold text-zinc-400">Carbo</span>
                </div>
                <div className="flex items-baseline gap-1">
                    {isEditing ? (
                         <input
                             type="number"
                             value={editableData.carbs}
                             onChange={(e) => handleInputChange('carbs', e.target.value)}
                             className="w-12 bg-transparent text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-300 dark:border-zinc-700 focus:outline-none"
                         />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(editableData.carbs)}</span>
                    )}
                    <span className="text-xs text-zinc-500 font-medium">g</span>
                </div>
            </div>

            {/* Fat */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group shadow-sm">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                     <span className="text-2xl">🥑</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                     <span className="text-xs font-semibold text-zinc-400">Gordura</span>
                </div>
                <div className="flex items-baseline gap-1">
                    {isEditing ? (
                         <input
                             type="number"
                             value={editableData.fat}
                             onChange={(e) => handleInputChange('fat', e.target.value)}
                             className="w-12 bg-transparent text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-300 dark:border-zinc-700 focus:outline-none"
                         />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(editableData.fat)}</span>
                    )}
                    <span className="text-xs text-zinc-500 font-medium">g</span>
                </div>
            </div>
        </div>

        {/* Health Score */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                     <span className="text-lg">💖</span>
                 </div>
                 <span className="font-semibold text-zinc-900 dark:text-zinc-200">Health Score</span>
            </div>
            <div className="flex flex-col items-end">
                 <span className="text-xl font-bold text-zinc-900 dark:text-white">{editableData.healthScore || '-'}/10</span>
                 <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" 
                        style={{ width: `${(editableData.healthScore || 0) * 10}%` }}
                     ></div>
                 </div>
            </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Ingredientes</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                 {editableData.ingredients && editableData.ingredients.length > 0 ? (
                     editableData.ingredients.map((ing, i) => (
                        <div key={i} className="min-w-[100px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                             <img 
                                src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(ing)}&w=120&h=120&c=7&rs=1&p=0`} 
                                alt={ing} 
                                className="w-12 h-12 rounded-full object-cover mb-2 bg-zinc-100 dark:bg-zinc-800"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://placehold.co/100x100/27272a/a1a1aa?text=${ing.substring(0, 1).toUpperCase()}`;
                                }}
                             />
                             <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 line-clamp-2">{ing}</span>
                        </div>
                     ))
                 ) : (
                    <div className="text-zinc-500 text-sm italic">Nenhum ingrediente listado.</div>
                 )}
            </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-900 z-50 no-print">
            <div className="max-w-md mx-auto flex gap-3">
                 <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-white text-zinc-900 dark:text-black rounded-full font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <SparklesIcon className="w-4 h-4" />
                    Corrigir
                </button>
                <button
                    onClick={handleSave}
                    className="flex-[2] py-4 px-4 bg-black dark:bg-black border border-zinc-800 text-white rounded-full font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    <SaveIcon className="w-5 h-5" />
                    {isExistingRecord ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
