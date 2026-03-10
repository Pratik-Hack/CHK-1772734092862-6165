import { mainApi } from './api';
import type { AuthResponse, LoginRequest } from '@/models';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await mainApi.post('/auth/login', data);
    return res.data;
  },

  async register(data: Record<string, unknown>): Promise<AuthResponse> {
    const res = await mainApi.post('/auth/register', data);
    return res.data;
  },

  async getProfile() {
    const res = await mainApi.get('/users/profile');
    const d = res.data;
    return { user: d?.user ?? d, profile: d?.profile ?? null };
  },

  async updateMedicalSummary(data: Record<string, unknown>) {
    const res = await mainApi.put('/patients/medical-summary', data);
    return res.data;
  },

  async linkDoctor(code: string) {
    const res = await mainApi.post('/patients/link', { code });
    return res.data;
  },

  async getLinkedDoctor() {
    const res = await mainApi.get('/patients/doctor');
    return res.data;
  },

  async updateProfile(data: Record<string, unknown>) {
    const res = await mainApi.put('/users/profile', data);
    return res.data;
  },
};
