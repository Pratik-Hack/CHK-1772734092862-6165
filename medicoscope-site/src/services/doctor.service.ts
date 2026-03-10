import { mainApi } from './api';

export const doctorService = {
  async getPatients() {
    const res = await mainApi.get('/doctors/patients');
    return res.data;
  },
};
