import { mainApi } from './api';
import type { NearbyDoctor } from '@/models';

export const nearbyDoctorsService = {
  async search(params: { lat: number; lng: number; radius?: number; specialization?: string }): Promise<NearbyDoctor[]> {
    const res = await mainApi.get('/nearby-doctors/search', { params });
    const d = res.data;
    return Array.isArray(d) ? d : d?.nearbyDoctors ?? d?.doctors ?? d?.data ?? [];
  },

  async getSpecializations(): Promise<string[]> {
    const res = await mainApi.get('/nearby-doctors/specializations');
    const d = res.data;
    return Array.isArray(d) ? d : d?.specializations ?? d?.data ?? [];
  },
};
