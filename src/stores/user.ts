import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  preferredTutorId: string | null;
  learningGoal: number; // 하루 목표 레슨 수
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

interface UserStore {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  preferredTutorId: null,
  learningGoal: 3,
  notificationsEnabled: true,
  soundEnabled: true,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      resetPreferences: () =>
        set({ preferences: defaultPreferences }),
    }),
    {
      name: 'skillforge-user-preferences',
    }
  )
);
