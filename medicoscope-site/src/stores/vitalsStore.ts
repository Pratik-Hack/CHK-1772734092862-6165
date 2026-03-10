import { create } from 'zustand';
import type { VitalDataPoint, VitalAlert } from '@/models';

interface VitalsState {
  sessionId: string | null;
  isMonitoring: boolean;
  dataPoints: VitalDataPoint[];
  alerts: VitalAlert[];
  duration: number;
  setSessionId: (id: string | null) => void;
  setMonitoring: (monitoring: boolean) => void;
  addDataPoint: (point: VitalDataPoint) => void;
  addAlert: (alert: VitalAlert) => void;
  reset: () => void;
}

export const useVitalsStore = create<VitalsState>((set) => ({
  sessionId: null,
  isMonitoring: false,
  dataPoints: [],
  alerts: [],
  duration: 0,
  setSessionId: (id) => set({ sessionId: id }),
  setMonitoring: (monitoring) => set({ isMonitoring: monitoring }),
  addDataPoint: (point) =>
    set((state) => ({
      dataPoints: [...state.dataPoints, point].slice(-100),
      duration: state.duration + 3,
    })),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
    })),
  reset: () =>
    set({
      sessionId: null,
      isMonitoring: false,
      dataPoints: [],
      alerts: [],
      duration: 0,
    }),
}));
