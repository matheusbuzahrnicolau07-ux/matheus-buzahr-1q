
import { AnalysisRecord, User, WorkoutSession } from "../types";

const DB_NAME = "NutriVisionDB";
const STORE_HISTORY = "history";
const STORE_USER = "user";
const STORE_WORKOUTS = "workouts";
const DB_VERSION = 2; // Incremented version

// Helper para abrir o banco de dados
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
        reject(new Error("Seu navegador não suporta armazenamento local."));
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store para histórico de refeições
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const store = db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("userId", "userId", { unique: false });
      }

      // Store para dados do usuário
      if (!db.objectStoreNames.contains(STORE_USER)) {
        db.createObjectStore(STORE_USER, { keyPath: "id" });
      }

      // Store para treinos (NOVO)
      if (!db.objectStoreNames.contains(STORE_WORKOUTS)) {
        const store = db.createObjectStore(STORE_WORKOUTS, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("userId", "userId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  // --- FOOD RECORDS ---
  saveRecord: async (record: AnalysisRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readwrite");
      const store = tx.objectStore(STORE_HISTORY);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  deleteRecord: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readwrite");
      const store = tx.objectStore(STORE_HISTORY);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getAllHistory: async (userId?: string): Promise<AnalysisRecord[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readonly");
      const store = tx.objectStore(STORE_HISTORY);
      
      let request;
      if (userId) {
          const index = store.index("userId");
          request = index.getAll(userId);
      } else {
          request = store.getAll();
      }

      request.onsuccess = () => {
          const records = request.result || [];
          records.sort((a, b) => b.timestamp - a.timestamp);
          resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // --- WORKOUTS ---
  saveWorkout: async (workout: WorkoutSession): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORKOUTS, "readwrite");
        const store = tx.objectStore(STORE_WORKOUTS);
        const request = store.put(workout);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },

  getWorkouts: async (userId: string): Promise<WorkoutSession[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_WORKOUTS, "readonly");
        const store = tx.objectStore(STORE_WORKOUTS);
        const index = store.index("userId");
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const records = request.result || [];
            records.sort((a, b) => b.timestamp - a.timestamp);
            resolve(records);
        };
        request.onerror = () => reject(request.error);
    });
  },

  // --- USER ---
  saveUser: async (user: User): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USER, "readwrite");
      const store = tx.objectStore(STORE_USER);
      const request = store.put(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getUser: async (id: string): Promise<User | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USER, "readonly");
      const store = tx.objectStore(STORE_USER);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
};
