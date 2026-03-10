import { mainApi } from './api';
import type { NearbyDoctor } from '@/models';

export const adminService = {
  async getStats() {
    const res = await mainApi.get('/admin/stats');
    return res.data;
  },

  async getPatients() {
    const res = await mainApi.get('/admin/patients');
    return res.data;
  },

  async getDoctors() {
    const res = await mainApi.get('/admin/doctors');
    return res.data;
  },

  async getNearbyDoctors(): Promise<NearbyDoctor[]> {
    const res = await mainApi.get('/admin/nearby-doctors');
    return res.data;
  },

  async addNearbyDoctor(data: Omit<NearbyDoctor, 'id' | 'distance'>) {
    const res = await mainApi.post('/admin/nearby-doctors', data);
    return res.data;
  },
};
