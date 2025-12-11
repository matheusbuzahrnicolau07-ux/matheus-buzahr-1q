
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionData, User, WorkoutSession, WorkoutSplit } from "../types";

// Função auxiliar para inicializar a IA apenas quando necessário
// Isso previne que o app quebre na inicialização se o process.env não estiver definido
const getGenAI = () => {
  let apiKey = '';
  try {
    // Tenta acessar a chave de várias formas para compatibilidade
    apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
  } catch (e) {
    console.warn("Erro ao acessar variáveis de ambiente", e);
  }

  if (!apiKey) {
    console.error("API Key não encontrada. Verifique seu arquivo .env ou vite.config.ts");
  }
  
  return new GoogleGenAI({ apiKey });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: {
      type: Type.STRING,
      description: "Nome do prato ou alimento identificado em português.",
    },
    weightGrams: {
      type: Type.NUMBER,
      description: "Peso estimado do alimento em gramas baseado no tamanho visual.",
    },
    calories: {
      type: Type.NUMBER,
      description: "Total de calorias para o peso estimado.",
    },
    carbs: {
      type: Type.NUMBER,
      description: "Total de carboidratos (g) para o peso estimado.",
    },
    protein: {
      type: Type.NUMBER,
      description: "Total de proteínas (g) para o peso estimado.",
    },
    fat: {
      type: Type.NUMBER,
      description: "Total de gorduras (g) para o peso estimado.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Nível de confiança da identificação de 0 a 100.",
    },
    healthScore: {
      type: Type.NUMBER,
      description: "Nota de saudabilidade de 0 a 10 (10 sendo muito saudável).",
    },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista estimada dos 3 a 5 principais ingredientes visíveis.",
    },
    insights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de 2 a 3 insights nutricionais curtos.",
    },
  },
  required: ["foodName", "weightGrams", "calories", "carbs", "protein", "fat", "confidence", "healthScore"],
};

// Schema para o Treino
const workoutSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        focusGroup: { type: Type.STRING, description: "Nome técnico e comum do foco do treino (ex: Peitoral e Tríceps)." },
        exercises: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Nome do exercício em Português." },
                    sets: { type: Type.NUMBER, description: "Número de séries." },
                    reps: { type: Type.STRING, description: "Faixa de repetições (ex: 8-12 ou Falha)." },
                    rest: { type: Type.STRING, description: "Tempo de descanso (ex: 60s)." },
                    notes: { type: Type.STRING, description: "Dica curta de execução." },
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
    const ai = getGenAI(); // Inicializa aqui

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Você é um nutricionista brasileiro experiente. Analise esta imagem de comida. Identifique o alimento, estime o peso visualmente, calcule os macronutrientes, liste os ingredientes visíveis e dê uma nota de saúde (0-10). Responda estritamente com o JSON solicitado.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
        systemInstruction: "Sempre responda em Português do Brasil. Se a imagem não for de comida, defina 'confidence' como 0.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do modelo");

    const data = JSON.parse(text) as NutritionData;
    return data;

  } catch (error) {
    console.error("Erro na análise da imagem:", error);
    throw new Error("Falha ao analisar a imagem. Tente novamente.");
  }
};

export const generateWorkoutRoutine = async (user: User, split: WorkoutSplit, muscleGroup: string): Promise<Omit<WorkoutSession, 'id' | 'userId' | 'timestamp' | 'completed'>> => {
    try {
        const goalMap = {
            'lose_weight': 'Perda de gordura e definição',
            'maintain': 'Manutenção e saúde',
            'gain_muscle': 'Hipertrofia muscular'
        };
        
        const userGoal = user.weightGoal ? goalMap[user.weightGoal] : 'Geral';
        const level = user.activityLevel === 'very_active' ? 'Avançado' : user.activityLevel === 'sedentary' ? 'Iniciante' : 'Intermediário';

        const prompt = `
            Crie um treino funcional e racional para hoje.
            Perfil: Nível ${level}, Objetivo: ${userGoal}.
            Divisão de Treino: ${split}.
            Grupamento Muscular Foco de Hoje: ${muscleGroup}.

            O treino deve conter entre 4 a 7 exercícios. Escolha exercícios eficientes biomecanicamente.
            Inclua número de séries, faixa de repetições e tempo de descanso adequado ao objetivo.
            Responda APENAS com o JSON.
        `;

        const ai = getGenAI(); // Inicializa aqui

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: workoutSchema,
                temperature: 0.4,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Erro ao gerar treino");
        
        // O retorno do schema é { focusGroup: string, exercises: [...] }
        // Precisamos adicionar o 'split' manualmente depois, ou pedir no JSON. 
        // Aqui mapeamos a resposta para o objeto parcial.
        const result = JSON.parse(text);
        
        return {
            split: split,
            focusGroup: result.focusGroup,
            exercises: result.exercises.map((ex: any) => ({ ...ex, completed: false }))
        };

    } catch (error) {
        console.error("Erro ao gerar treino:", error);
        throw new Error("Falha ao criar rotina de treino.");
    }
};
