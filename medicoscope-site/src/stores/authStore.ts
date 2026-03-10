import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserModel, PatientModel, DoctorModel } from '@/models';

interface AuthState {
  token: string | null;
  user: UserModel | null;
  patientData: PatientModel | null;
  doctorData: DoctorModel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: UserModel) => void;
  setPatientData: (data: PatientModel) => void;
  setDoctorData: (data: DoctorModel) => void;
  setUser: (user: UserModel) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      patientData: null,
      doctorData: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),
      setPatientData: (data) => set({ patientData: data }),
      setDoctorData: (data) => set({ doctorData: data }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          token: null,
          user: null,
          patientData: null,
          doctorData: null,
          isAuthenticated: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'medicoscope-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        patientData: state.patientData,
        doctorData: state.doctorData,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
