import { mainApi } from './api';

export const doctorService = {
  async getPatients() {
    const res = await mainApi.get('/doctors/patients');
    const d = res.data;
    return Array.isArray(d) ? d : d?.patients ?? [];
  },
};
