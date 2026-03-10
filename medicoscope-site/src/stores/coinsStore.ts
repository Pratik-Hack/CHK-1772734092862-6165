import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoinsState {
  totalCoins: number;
  streak: number;
  sessions: number;
  lastSessionDate: string | null;
  setCoins: (coins: number) => void;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  addChatCoins: () => void;
  addMindSpaceCoins: () => void;
}

export const useCoinsStore = create<CoinsState>()(
  persist(
    (set, get) => ({
      totalCoins: 0,
      streak: 0,
      sessions: 0,
      lastSessionDate: null,
      setCoins: (coins) => set({ totalCoins: coins }),
      addCoins: (amount) => set((state) => ({ totalCoins: state.totalCoins + amount })),
      deductCoins: (amount) => {
        const state = get();
        if (state.totalCoins >= amount) {
          set({ totalCoins: state.totalCoins - amount });
          return true;
        }
        return false;
      },
      addChatCoins: () => {
        const today = new Date().toDateString();
        const state = get();
        if (state.lastSessionDate !== today) {
          set({ totalCoins: state.totalCoins + 5, sessions: state.sessions + 1, lastSessionDate: today });
        }
      },
      addMindSpaceCoins: () => {
        set((state) => ({ totalCoins: state.totalCoins + 5, sessions: state.sessions + 1 }));
      },
    }),
    { name: 'medicoscope-coins' }
  )
);
