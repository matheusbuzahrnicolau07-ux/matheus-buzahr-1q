
import React, { useState, useEffect, useRef } from 'react';
import { User, NutritionData, AnalysisRecord, AppView, UserGoals, MealType } from './types';
import { analyzeFoodImage } from './services/geminiService';
import { storageService } from './services/storage';
import AnalysisResult from './components/AnalysisResult';
import HistoryScreen from './components/HistoryScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingScreen from './components/OnboardingScreen';
import WaterModal from './components/WaterModal';
import WorkoutScreen from './components/WorkoutScreen';
import AuthScreen from './components/AuthScreen';
import { HistoryIcon, LeafIcon, HomeIcon, PlusIcon, FireIcon, SettingsIcon, DropletIcon, ChevronLeftIcon, CheckCircleIcon, SaveIcon, ArrowRightIcon, RefreshIcon, ArrowLeftIcon, CalendarIcon, DumbbellIcon, CameraIcon, PhotoIcon, XMarkIcon } from './components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Default Goals
const DEFAULT_GOALS: UserGoals = {
    calories: 2000,
    protein: 140,
    carbs: 220,
    fat: 65,
    water: 2500
};

type Theme = 'dark' | 'light';

function App() {
  // State
  const [view, setView] = useState<AppView>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<NutritionData | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null); 
  const [theme, setTheme] = useState<Theme>('dark');
  const [isScanOptionsOpen, setIsScanOptionsOpen] = useState(false);
  
  // Water Tracker State
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterAnimating, setWaterAnimating] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  
  // Day finished state for UI feedback
  const [dayFinished, setDayFinished] = useState(false);

  // Date Navigation State
  const [dateOffset, setDateOffset] = useState(0); // 0 = Today, -1 = Yesterday, 1 = Tomorrow
  
  // Scroll State for UI transitions
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    // Theme Init
    const savedTheme = localStorage.getItem('nutrivision_theme') as Theme;
    if (savedTheme) {
        setTheme(savedTheme);
    }

    // Load User ID from LocalStorage (Session)
    const storedUserId = localStorage.getItem('nutrivision_user_id');
    
    const initApp = async () => {
        if (storedUserId) {
            try {
                // Load full user object from IndexedDB
                const loadedUser = await storageService.getUser(storedUserId);
                if (loadedUser) {
                    if (!loadedUser.goals) loadedUser.goals = DEFAULT_GOALS;
                    setUser(loadedUser);
                    
                    // Load History
                    const loadedHistory = await storageService.getAllHistory(storedUserId);
                    setHistory(loadedHistory);
                    
                    setView('home');
                } else {
                    // Fallback if ID exists but data missing
                    localStorage.removeItem('nutrivision_user_id');
                    setView('welcome');
                }
            } catch (e) {
                console.error("Erro ao carregar dados:", e);
                setView('welcome');
            }
        }
    };
    
    initApp();
    
    // Simple daily water reset simulation
    const savedWater = localStorage.getItem('nutrivision_water');
    const savedDate = localStorage.getItem('nutrivision_water_date');
    const today = new Date().toDateString();
    
    if (savedDate === today && savedWater) {
        setWaterIntake(parseInt(savedWater));
    } else {
        setWaterIntake(0);
        localStorage.setItem('nutrivision_water_date', today);
    }
    
    checkDayStatus(new Date());

    // Scroll Listener
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if the currently viewed day is finished
  const checkDayStatus = (dateToCheck: Date) => {
    const dateStr = dateToCheck.toDateString();
    const finishedDate = localStorage.getItem('nutrivision_last_finished_date');
    
    if (finishedDate === dateStr) {
        setDayFinished(true);
    } else {
        setDayFinished(false);
    }
  };

  useEffect(() => {
      // Whenever offset changes, re-check finish status
      const displayDate = new Date();
      displayDate.setDate(new Date().getDate() + dateOffset);
      checkDayStatus(displayDate);
  }, [dateOffset]);

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('nutrivision_theme', newTheme);
  };

  // Persist Water with Animation
  const updateWater = (amount: number) => {
      if (amount > 0) {
        // Trigger animation only for positive adds
        setWaterAnimating(true);
        setTimeout(() => setWaterAnimating(false), 500);
      }

      const newValue = Math.max(0, waterIntake + amount);
      setWaterIntake(newValue);
      localStorage.setItem('nutrivision_water', newValue.toString());
      localStorage.setItem('nutrivision_water_date', new Date().toDateString());
  };

  // Handlers
  const handleAuth = async (email: string, password: string, name?: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = btoa(email).substring(0, 16); 

    const newUser: User = {
      id: userId,
      name: name || email.split('@')[0],
      email: email,
      joinedAt: Date.now(),
      goals: DEFAULT_GOALS,
      weightGoal: 'maintain',
      activityLevel: 'moderately_active'
    };

    try {
        // Try to load existing
        const existingUser = await storageService.getUser(userId);
        
        if (existingUser && !name) {
            setUser(existingUser);
            // Load history
            const userHistory = await storageService.getAllHistory(userId);
            setHistory(userHistory);
            
            localStorage.setItem('nutrivision_user_id', userId);
            setView('home');
        } else {
            // New user or overwriting with name
            await storageService.saveUser(newUser);
            setUser(newUser);
            localStorage.setItem('nutrivision_user_id', userId);
            setView('onboarding'); 
        }
    } catch (e) {
        console.error("Auth error", e);
    }
  };

  const handleSkipAuth = () => {
     setView('welcome');
  };

  const handleOnboardingComplete = async (updatedUser: User) => {
    setUser(updatedUser);
    await storageService.saveUser(updatedUser);
    setView('home');
  };

  const handleUpdateProfile = async (updatedUser: User) => {
      setUser(updatedUser);
      await storageService.saveUser(updatedUser);
      if (view === 'settings') setView('home');
  };

  const handleInitiateScan = (type: MealType) => {
      setSelectedMealType(type);
      setIsScanOptionsOpen(true);
  };

  const handleGenericScan = () => {
      const hour = new Date().getHours();
      let type: MealType = 'snack';
      if (hour >= 5 && hour < 11) type = 'breakfast';
      else if (hour >= 11 && hour < 15) type = 'lunch';
      else if (hour >= 18 && hour < 24) type = 'dinner';
      else type = 'snack';
      
      setSelectedMealType(type);
      setIsScanOptionsOpen(true);
  };

  const handleCameraSelect = () => {
    setIsScanOptionsOpen(false);
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    setIsScanOptionsOpen(false);
    galleryInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setView('camera'); 

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setCurrentImage(base64);
      try {
        const result = await analyzeFoodImage(base64);
        setCurrentAnalysis(result);
        setView('result');
      } catch (err: any) {
        setError("Não foi possível identificar o alimento. Tente uma foto mais clara.");
        setTimeout(() => setError(null), 4000);
        setView('home');
      } finally {
        setIsLoading(false);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAnalysis = async (data: NutritionData, finalMealType: MealType) => {
    if (!currentImage || !user) return;
    
    // CHECK IF WE ARE EDITING AN EXISTING RECORD (HAS ID) OR CREATING NEW
    const existingRecord = currentAnalysis as AnalysisRecord;
    
    let recordToSave: AnalysisRecord;

    if (existingRecord && existingRecord.id) {
        // UPDATE EXISTING RECORD
        recordToSave = {
            ...existingRecord,
            ...data,
            mealType: finalMealType
        };
        
        // Optimistic update
        setHistory(prev => prev.map(item => item.id === recordToSave.id ? recordToSave : item));
    } else {
        // CREATE NEW RECORD
        // Use the current display date
        const displayDate = new Date();
        displayDate.setDate(new Date().getDate() + dateOffset);
        const now = new Date();
        displayDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        recordToSave = {
          ...data,
          id: Date.now().toString(),
          imageUrl: currentImage,
          timestamp: displayDate.getTime(), 
          userId: user.id, 
          mealType: finalMealType 
        };
        
        // Optimistic update
        setHistory(prev => [recordToSave, ...prev]);
    }

    // Save to DB
    await storageService.saveRecord(recordToSave);

    setCurrentImage(null);
    setCurrentAnalysis(null);
    setView('home');
  };

  const handleDeleteAnalysis = async (recordId: string) => {
      // Optimistic update
      setHistory(prev => prev.filter(item => item.id !== recordId));
      
      // DB Delete
      await storageService.deleteRecord(recordId);

      if (currentAnalysis && (currentAnalysis as AnalysisRecord).id === recordId) {
          setCurrentImage(null);
          setCurrentAnalysis(null);
          setView('home');
      }
  };

  const handleSelectHistoryItem = (item: AnalysisRecord) => {
    setCurrentImage(item.imageUrl);
    setCurrentAnalysis(item);
    if (item.mealType) setSelectedMealType(item.mealType);
    setView('result');
  };

  const handleFinishDay = () => {
      if (!dayFinished) {
          setDayFinished(true);
          const displayDate = new Date();
          displayDate.setDate(new Date().getDate() + dateOffset);
          localStorage.setItem('nutrivision_last_finished_date', displayDate.toDateString());
      }
  };

  const handleReopenDay = () => {
      setDayFinished(false);
      localStorage.removeItem('nutrivision_last_finished_date');
  };

  const handleGoToNextDay = () => {
      setDateOffset(prev => prev + 1);
  };

  // Calculate Stats based on Date Offset
  const getTodayStats = () => {
    const displayDate = new Date();
    displayDate.setDate(new Date().getDate() + dateOffset);
    const dateKey = displayDate.setHours(0,0,0,0);

    const userHistory = history.filter(item => item.userId === user?.id);
    const dayMeals = userHistory.filter(item => new Date(item.timestamp).setHours(0,0,0,0) === dateKey);
    
    const totalCals = dayMeals.reduce((acc, curr) => acc + curr.calories, 0);
    const totalProtein = dayMeals.reduce((acc, curr) => acc + curr.protein, 0);
    const totalCarbs = dayMeals.reduce((acc, curr) => acc + curr.carbs, 0);
    const totalFat = dayMeals.reduce((acc, curr) => acc + curr.fat, 0);
    const goals = user?.goals || DEFAULT_GOALS;
    const remaining = Math.max(0, goals.calories - totalCals);
    
    const groupedMeals: Record<MealType, AnalysisRecord[]> = {
        breakfast: dayMeals.filter(m => m.mealType === 'breakfast'),
        lunch: dayMeals.filter(m => m.mealType === 'lunch'),
        dinner: dayMeals.filter(m => m.mealType === 'dinner'),
        snack: dayMeals.filter(m => m.mealType === 'snack' || !m.mealType), 
    };

    let relativeLabel = "";
    if (dateOffset === 0) relativeLabel = "Hoje";
    else if (dateOffset === 1) relativeLabel = "Amanhã";
    else if (dateOffset === -1) relativeLabel = "Ontem";

    const formattedDate = displayDate.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'long' 
    });

    return { totalCals, totalProtein, totalCarbs, totalFat, remaining, dayMeals, goals, groupedMeals, relativeLabel, formattedDate, displayDate };
  };

  const { totalCals, totalProtein, totalCarbs, totalFat, remaining, dayMeals, goals, groupedMeals, relativeLabel, formattedDate, displayDate } = getTodayStats();
  
  const progressData = [
      { day: 'Seg', weight: 68.2 },
      { day: 'Ter', weight: 68.0 },
      { day: 'Qua', weight: 67.8 },
      { day: 'Qui', weight: 67.5 },
      { day: 'Sex', weight: 67.2 },
      { day: 'Sab', weight: 67.4 },
      { day: 'Dom', weight: 66.8 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800/95 dark:bg-zinc-800/95 bg-white/95 backdrop-blur-md border border-zinc-700 dark:border-zinc-700 border-zinc-200 p-3 rounded-2xl shadow-2xl">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
             <p className="text-zinc-900 dark:text-white font-bold text-xl">{payload[0].value}</p>
             <span className="text-xs font-medium text-emerald-500">kg</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const MealSection = ({ title, type, items, icon }: { title: string, type: MealType, items: AnalysisRecord[], icon: string }) => {
    const sectionCals = items.reduce((acc, curr) => acc + curr.calories, 0);
    
    return (
        <div className="bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-4 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
                        <p className="text-xs text-zinc-500 font-medium">{Math.round(sectionCals)} kcal</p>
                    </div>
                </div>
                {!dayFinished && (
                    <button 
                        onClick={() => handleInitiateScan(type)}
                        className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 active:scale-90 transition-transform hover:bg-emerald-500/20"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            <div className="p-2 space-y-1">
                {items.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">Nenhum registro</p>
                    </div>
                ) : (
                    items.slice().reverse().map(item => (
                        <div key={item.id} onClick={() => handleSelectHistoryItem(item)} className="p-2 rounded-xl flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer active:scale-[0.99]">
                            <img 
                                src={item.imageUrl} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800" 
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/18181b/52525b?text=Food'; }}
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-zinc-800 dark:text-white text-xs truncate">{item.foodName}</h4>
                                <p className="text-zinc-500 text-[10px] font-medium">{Math.round(item.calories)} kcal</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  const BottomNav = () => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <nav className="flex items-center justify-between p-2 bg-zinc-900/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50">
            {/* Home */}
            <button 
                onClick={() => setView('home')} 
                className={`p-3 rounded-full transition-all duration-300 ${view === 'home' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white'}`}
            >
                <HomeIcon className="w-6 h-6" />
            </button>

            {/* Workout */}
            <button 
                onClick={() => setView('workout')} 
                className={`p-3 rounded-full transition-all duration-300 ${view === 'workout' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white'}`}
            >
                <DumbbellIcon className="w-6 h-6" />
            </button>
            
            {/* Center Plus */}
            <button 
                onClick={handleGenericScan}
                disabled={dayFinished}
                className={`w-14 h-14 -my-4 rounded-full flex items-center justify-center text-black shadow-lg shadow-emerald-500/30 transition-all mx-1 ${dayFinished ? 'bg-zinc-700 cursor-not-allowed opacity-50' : 'bg-emerald-500 hover:scale-105 active:scale-95 border-4 border-zinc-950'}`}
            >
                <PlusIcon className="w-8 h-8" />
            </button>

            {/* History */}
            <button 
                onClick={() => setView('history')} 
                className={`p-3 rounded-full transition-all duration-300 ${view === 'history' || view === 'progress' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white'}`}
            >
                <HistoryIcon className="w-6 h-6" />
            </button>

            {/* Settings */}
            <button 
                onClick={() => setView('settings')} 
                className={`p-3 rounded-full transition-all duration-300 ${view === 'settings' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white'}`}
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
        </nav>
    </div>
  );

  return (
    <div className={theme}>
        {/* Scan Options Modal */}
        {isScanOptionsOpen && (
             <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsScanOptionsOpen(false)}
                ></div>
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Adicionar Refeição</h3>
                        <button onClick={() => setIsScanOptionsOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <XMarkIcon className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleCameraSelect}
                            className="bg-emerald-500 text-black p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                        >
                            <CameraIcon className="w-10 h-10" />
                            <span className="font-bold">Câmera</span>
                        </button>
                        <button 
                            onClick={handleGallerySelect}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-transform"
                        >
                            <PhotoIcon className="w-10 h-10" />
                            <span className="font-bold">Galeria</span>
                        </button>
                    </div>
                </div>
             </div>
        )}

        <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
            
            <WaterModal 
                isOpen={isWaterModalOpen}
                onClose={() => setIsWaterModalOpen(false)}
                current={waterIntake}
                goal={user?.goals?.water || 2500}
                onAdd={updateWater}
            />

            {view === 'welcome' && (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-zinc-950">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 p-6 rounded-[2rem] mb-10 shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)] flex items-center justify-center">
                            <LeafIcon className="w-12 h-12 text-black" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">Nutri<span className="text-emerald-500">Vision</span></h1>
                        <p className="text-xl text-zinc-300 mb-12 font-medium max-w-xs mx-auto leading-relaxed">
                            A maneira mais inteligente de rastrear sua dieta. Basta apontar e capturar.
                        </p>
                        <button 
                        onClick={() => setView('login')}
                        className="w-full max-w-xs bg-white text-black font-extrabold text-lg py-5 rounded-full hover:bg-zinc-100 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                        >
                        Começar
                        </button>
                    </div>
                </div>
            )}

            {view === 'login' && (
                <AuthScreen 
                    onLogin={handleAuth}
                    onSkip={handleSkipAuth}
                />
            )}

            {view === 'onboarding' && user && (
                <OnboardingScreen 
                    user={user}
                    onComplete={handleOnboardingComplete}
                />
            )}

            {view === 'camera' && isLoading && (
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                    <div className="relative w-64 h-64 border-2 border-dashed border-emerald-500/50 rounded-[2.5rem] flex items-center justify-center overflow-hidden mb-8">
                        <div className="w-full h-full bg-emerald-500/10 absolute animate-ping opacity-20"></div>
                        <LeafIcon className="w-20 h-20 text-emerald-500 animate-bounce" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Analisando...</h2>
                    <p className="text-zinc-500 text-center max-w-xs font-medium">Identificando alimentos e calculando nutrientes.</p>
                </div>
            )}

            {view === 'result' && currentAnalysis && currentImage && (
                <AnalysisResult 
                    data={currentAnalysis}
                    imageUrl={currentImage}
                    onSave={handleSaveAnalysis}
                    onCancel={() => setView('home')}
                    initialMealType={selectedMealType || undefined}
                    onDelete={handleDeleteAnalysis}
                />
            )}

            {view === 'history' && (
                <>
                    <HistoryScreen 
                        history={history.filter(h => h.userId === user?.id)} 
                        onBack={() => setView('home')}
                        onSelect={handleSelectHistoryItem}
                    />
                    <BottomNav />
                    {/* Hidden Inputs for Camera and Gallery */}
                    <input 
                        type="file" 
                        ref={cameraInputRef} 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                    <input 
                        type="file" 
                        ref={galleryInputRef} 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                </>
            )}

            {view === 'workout' && user && (
                <>
                    <WorkoutScreen 
                        user={user} 
                        onBack={() => setView('home')} 
                        date={displayDate}
                    />
                    <BottomNav />
                    <input 
                        type="file" 
                        ref={cameraInputRef} 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                    <input 
                        type="file" 
                        ref={galleryInputRef} 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                </>
            )}

            {view === 'progress' && (
                <div className="min-h-screen flex flex-col pb-32 no-scrollbar p-6 animate-in fade-in duration-500 bg-gray-50 dark:bg-zinc-950">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Seu Progresso</h2>
                        <button 
                            onClick={() => setView('home')}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-white active:scale-95 transition-transform shadow-sm"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Peso Corporal</h3>
                                <p className="text-zinc-500 text-sm font-medium">Últimos 7 dias</p>
                            </div>
                            <div className="bg-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-500">-1.4 kg</span>
                            </div>
                        </div>
                        
                        <div className="h-64 w-full relative z-10">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={progressData}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12, fontWeight: 700}} dy={15} />
                                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 2 }} />
                                    <Area type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" animationDuration={1500} />
                                </AreaChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <BottomNav />
                    <input 
                        type="file" 
                        ref={cameraInputRef} 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                    <input 
                        type="file" 
                        ref={galleryInputRef} 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                    />
                </div>
            )}

            {view === 'settings' && user && (
                <ProfileScreen 
                    user={user}
                    onSave={handleUpdateProfile}
                    onBack={() => setView('home')}
                    onLogout={() => {
                        localStorage.removeItem('nutrivision_user_id');
                        setUser(null);
                        setView('welcome');
                    }}
                    onClearHistory={async () => {
                        // In a real app we'd clear IDB, but here let's just clear state
                        // The user can re-login to see empty history or we implement delete all in service
                        setHistory([]);
                    }}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            )}

            {view === 'home' && user && (
                <div className="min-h-screen flex flex-col pb-32 no-scrollbar animate-in fade-in duration-500 bg-gray-50 dark:bg-zinc-950">
                  
                  <div className="px-6 pt-12 pb-2 flex justify-between items-center sticky top-0 z-30 bg-gray-50/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-colors">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/20">
                             {user?.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest transition-all">
                                {isScrolled ? formattedDate : "Olá,"}
                            </p>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{user?.name}</h1>
                         </div>
                    </div>
                    <button onClick={() => setView('settings')} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="px-5 space-y-4">
                     
                     <div className="grid grid-cols-2 gap-3">
                         <div onClick={() => setView('progress')} className="col-span-2 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all shadow-sm">
                             <div className="flex justify-between items-start relative z-10">
                                 <div>
                                     <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Disponível</p>
                                     <div className="flex items-baseline gap-1">
                                         <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>{Math.round(remaining)}</h2>
                                         <span className="text-zinc-500 font-medium">kcal</span>
                                     </div>
                                     <div className="mt-4 flex gap-4">
                                         <div>
                                             <p className="text-zinc-500 dark:text-zinc-600 text-[10px] font-bold uppercase">Consumido</p>
                                             <p className="text-zinc-800 dark:text-white font-bold">{Math.round(totalCals)}</p>
                                         </div>
                                         <div>
                                             <p className="text-zinc-500 dark:text-zinc-600 text-[10px] font-bold uppercase">Meta</p>
                                             <p className="text-emerald-400 font-bold">{goals.calories}</p>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* CORREÇÃO DO GRÁFICO CORTADO E EFEITOS DE NEON */}
                                 <div className="h-32 w-32 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={[{v: totalCals}, {v: remaining}]} 
                                                cx="50%" cy="50%" 
                                                innerRadius={42} 
                                                outerRadius={52} 
                                                dataKey="v" 
                                                startAngle={90} 
                                                endAngle={-270} 
                                                stroke="none" 
                                                cornerRadius={10} 
                                                paddingAngle={5}
                                            >
                                                <Cell fill={theme === 'light' ? "#e4e4e7" : "#27272a"} opacity={theme === 'light' ? 1 : 0.5} /> 
                                                <Cell 
                                                    fill="#10B981" 
                                                    style={{ filter: "drop-shadow(0px 0px 6px rgba(16, 185, 129, 0.6))" }}
                                                /> 
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-30 animate-pulse"></div>
                                            <FireIcon className="w-8 h-8 text-emerald-400 relative z-10 animate-pulse" />
                                        </div>
                                    </div>
                                 </div>
                             </div>
                         </div>

                        <div 
                            className={`bg-blue-50 dark:bg-blue-950/20 p-5 rounded-[2rem] border border-blue-200 dark:border-blue-500/20 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm select-none ${waterAnimating ? 'scale-[0.97] bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500/50' : 'active:scale-[0.98]'}`} 
                            onClick={() => setIsWaterModalOpen(true)}
                        >
                            {waterAnimating && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-out fade-out slide-out-to-top-10 duration-500">
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 drop-shadow-md">Adicionado</span>
                                </div>
                            )}

                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200 dark:bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-300 dark:group-hover:bg-blue-500/30 transition-all opacity-50 dark:opacity-100"></div>
                            <div className={`relative z-10 transition-opacity duration-200 ${waterAnimating ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                <DropletIcon className={`w-6 h-6 text-blue-500 dark:text-blue-400 transition-transform duration-500 ${waterAnimating ? 'scale-110 rotate-12' : ''}`} />
                                <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30 transition-colors">
                                    <PlusIcon className="w-3 h-3" />
                                    Adicionar
                                </span>
                                </div>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white">{waterIntake}<span className="text-sm text-blue-400 dark:text-blue-300/70 font-medium ml-1">/{goals.water || 2500}</span></p>
                                <div className="w-full bg-blue-100 dark:bg-blue-950/50 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (waterIntake / (goals.water || 2500)) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                         <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl">🥩</span>
                             </div>
                             <div>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase">Proteína</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-white">{Math.round(totalProtein)}<span className="text-xs text-zinc-500 font-medium">/{goals.protein}g</span></p>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                     <div className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: `${Math.min(100, (totalProtein / goals.protein) * 100)}%` }}></div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shadow-sm">
                              <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              <div>
                                  <p className="text-zinc-500 text-[10px] font-bold uppercase">Carbo</p>
                                  <p className="text-zinc-900 dark:text-white font-bold">{Math.round(totalCarbs)} / {goals.carbs}g</p>
                              </div>
                          </div>
                          <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shadow-sm">
                              <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                              <div>
                                  <p className="text-zinc-500 text-[10px] font-bold uppercase">Gordura</p>
                                  <p className="text-zinc-900 dark:text-white font-bold">{Math.round(totalFat)} / {goals.fat}g</p>
                              </div>
                          </div>
                     </div>

                     <div className="py-2">
                        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <button 
                            onClick={() => setDateOffset(prev => prev - 1)} 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                              <ArrowLeftIcon className="w-6 h-6" />
                          </button>
                          
                          <div className="flex flex-col items-center">
                              {relativeLabel && (
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full mb-0.5">{relativeLabel}</span>
                              )}
                              <h2 className="text-lg font-black text-zinc-900 dark:text-white capitalize leading-none flex items-center gap-2">
                                  {!relativeLabel && <CalendarIcon className="w-4 h-4 text-zinc-500" />}
                                  {formattedDate}
                              </h2>
                          </div>

                          <button 
                            onClick={() => setDateOffset(prev => prev + 1)} 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                              <ArrowRightIcon className="w-6 h-6" />
                          </button>
                        </div>
                     </div>

                     <div className="pt-4 space-y-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Diário Alimentar</h3>
                        
                        <MealSection title="Café da Manhã" type="breakfast" icon="☕" items={groupedMeals.breakfast} />
                        <MealSection title="Almoço" type="lunch" icon="🍽️" items={groupedMeals.lunch} />
                        <MealSection title="Jantar" type="dinner" icon="🌙" items={groupedMeals.dinner} />
                        <MealSection title="Lanches" type="snack" icon="🍎" items={groupedMeals.snack} />
                     </div>
                     
                     <div className="py-6">
                        {dayFinished ? (
                             <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                 <button 
                                    onClick={handleReopenDay}
                                    className="flex-1 py-4 rounded-2xl font-bold text-md flex items-center justify-center gap-2 transition-all shadow-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-[0.98]"
                                 >
                                     <RefreshIcon className="w-5 h-5" />
                                     Reabrir Dia
                                 </button>
                                 <button 
                                    onClick={handleGoToNextDay}
                                    className="flex-1 py-4 rounded-2xl font-bold text-md flex items-center justify-center gap-2 transition-all shadow-lg bg-zinc-900 dark:bg-white text-white dark:text-black active:scale-[0.98]"
                                 >
                                     Ir para Amanhã
                                     <ArrowRightIcon className="w-5 h-5" />
                                 </button>
                             </div>
                        ) : (
                            <button 
                                onClick={handleFinishDay}
                                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg bg-zinc-900 dark:bg-white text-white dark:text-black active:scale-[0.98]"
                            >
                                <SaveIcon className="w-6 h-6" />
                                Finalizar Dia
                            </button>
                        )}
                    </div>

                  </div>

                  <BottomNav />
                  {/* Inputs ocultos para Câmera e Galeria */}
                  <input 
                      type="file" 
                      ref={cameraInputRef} 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleImageSelect} 
                      className="hidden" 
                  />
                  <input 
                      type="file" 
                      ref={galleryInputRef} 
                      accept="image/*" 
                      onChange={handleImageSelect} 
                      className="hidden" 
                  />
                </div>
            )}
        </div>
    </div>
  );
}

export default App;
