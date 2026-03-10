import { mainApi } from './api';
import type { NearbyDoctor } from '@/models';

export const adminService = {
  async getStats() {
    const res = await mainApi.get('/admin/stats');
    const d = res.data;
    return d?.stats ?? d ?? {};
  },

  async getPatients() {
    const res = await mainApi.get('/admin/patients');
    const d = res.data;
    return Array.isArray(d) ? d : d?.patients ?? d?.data ?? [];
  },

  async getDoctors() {
    const res = await mainApi.get('/admin/doctors');
    const d = res.data;
    return Array.isArray(d) ? d : d?.doctors ?? d?.data ?? [];
  },

  async getNearbyDoctors(): Promise<NearbyDoctor[]> {
    const res = await mainApi.get('/admin/nearby-doctors');
    const d = res.data;
    return Array.isArray(d) ? d : d?.doctors ?? d?.nearbyDoctors ?? d?.data ?? [];
  },

  async addNearbyDoctor(data: Omit<NearbyDoctor, 'id' | 'distance'>) {
    const res = await mainApi.post('/admin/nearby-doctors', data);
    return res.data;
  },
};
