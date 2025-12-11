
export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // ml
}

// Simplified Goal Structure for Nutrition Focus
export type WeightGoal = 'lose_weight' | 'maintain' | 'gain_muscle';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface User {
  id: string;
  name: string;
  email: string;
  joinedAt: number;
  
  // Body Stats
  weight?: number; // kg
  height?: number; // cm
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: ActivityLevel;
  
  // Goals
  goals?: UserGoals;
  weightGoal?: WeightGoal;
}

export interface NutritionData {
  foodName: string;
  weightGrams: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  confidence: number; // 0-100
  healthScore?: number; // 0-10
  ingredients?: string[];
  insights?: string[];
}

export interface AnalysisRecord extends NutritionData {
  id: string;
  imageUrl: string;
  timestamp: number;
  userId: string;
  mealType?: MealType;
}

// --- WORKOUT TYPES ---
export type WorkoutSplit = 'FullBody' | 'UpperLower' | 'ABC' | 'ABCD' | 'ABCDE';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string; // e.g., "60s"
  completed: boolean;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  timestamp: number;
  split: WorkoutSplit;
  focusGroup: string; // e.g., "Peito e Tríceps"
  exercises: WorkoutExercise[];
  completed: boolean;
}

export type AppView = 'welcome' | 'login' | 'onboarding' | 'home' | 'camera' | 'result' | 'history' | 'progress' | 'settings' | 'workout';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}
