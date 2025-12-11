
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionData, User, WorkoutSession, WorkoutSplit } from "../types";

const getGenAI = () => {
  // Use process.env.API_KEY directly as per strict guidelines.
  // We assume it is injected via Vite's define plugin.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key não encontrada. Configure a variável de ambiente API_KEY.");
    throw new Error("Chave de API ausente");
  }
  
  return new GoogleGenAI({ apiKey });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING },
    weightGrams: { type: Type.NUMBER },
    calories: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    confidence: { type: Type.NUMBER },
    healthScore: { type: Type.NUMBER },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["foodName", "weightGrams", "calories", "carbs", "protein", "fat", "confidence", "healthScore"],
};

const workoutSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        focusGroup: { type: Type.STRING },
        exercises: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    notes: { type: Type.STRING },
                },
                required: ["name", "sets", "reps", "rest", "notes"]
            }
        }
    },
    required: ["focusGroup", "exercises"]
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionData> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: "Você é um nutricionista brasileiro experiente. Analise a imagem detalhadamente.\n\n**CRÍTICO - ESTIMATIVA DE PESO:**\n1. Seja CONSERVADOR com o peso. Um prato feito comum (almoço/jantar) pesa em média **300g a 500g**.\n2. Porções individuais de Escondidinho, Lasanha ou Massas pesam cerca de **300g a 400g**. NÃO estime 1kg (1000g) a menos que a imagem mostre claramente uma travessa familiar gigante com múltiplos utensílios de servir.\n3. Se houver bebidas (latas, copos), some ao total, mas descreva no nome.\n\nIdentifique os alimentos e macros. No campo 'foodName', seja descritivo (ex: 'Escondidinho de Carne Seca com Coca Zero'). No campo 'ingredients', liste tudo." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1, // Temperatura menor para ser mais "frio" e preciso nos dados
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do modelo");
    return JSON.parse(text) as NutritionData;

  } catch (error) {
    console.error("Erro na análise:", error);
    throw error;
  }
};

export const generateWorkoutRoutine = async (user: User, split: WorkoutSplit, muscleGroup: string): Promise<Omit<WorkoutSession, 'id' | 'userId' | 'timestamp' | 'completed'>> => {
    try {
        const goalMap = {
            'lose_weight': 'Perda de gordura',
            'maintain': 'Manutenção',
            'gain_muscle': 'Hipertrofia'
        };
        const userGoal = user.weightGoal ? goalMap[user.weightGoal] : 'Geral';
        const ai = getGenAI();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Crie um treino nível ${user.activityLevel} para ${userGoal}. Divisão: ${split}. Foco: ${muscleGroup}. 4-7 exercícios. JSON apenas.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: workoutSchema,
                temperature: 0.4,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Erro ao gerar treino");
        const result = JSON.parse(text);
        
        return {
            split: split,
            focusGroup: result.focusGroup,
            exercises: result.exercises.map((ex: any) => ({ ...ex, completed: false }))
        };

    } catch (error) {
        console.error("Erro no treino:", error);
        throw error;
    }
};
