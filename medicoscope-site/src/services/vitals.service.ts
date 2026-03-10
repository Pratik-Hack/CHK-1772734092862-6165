import { chatbotApi } from './api';
import type { VitalDataPoint, VitalAlert } from '@/models';

export const vitalsService = {
  async startSession(patientId: string) {
    const res = await chatbotApi.post('/vitals/start', { patientId });
    return res.data;
  },

  async tick(data: Record<string, unknown>): Promise<{ data_points: VitalDataPoint[]; alerts: VitalAlert[] }> {
    const res = await chatbotApi.post('/vitals/tick', data);
    return res.data;
  },

  async stopSession(patientId: string) {
    const res = await chatbotApi.post('/vitals/stop', { patientId });
    return res.data;
  },

  async saveSummary(data: Record<string, unknown>) {
    const res = await chatbotApi.post('/vitals/summary', data);
    return res.data;
  },

  async getPatientAlerts(patientId: string): Promise<VitalAlert[]> {
    const res = await chatbotApi.get(`/vitals/alerts/patient/${patientId}`);
    return res.data;
  },

  async getDoctorAlerts(doctorId: string): Promise<VitalAlert[]> {
    const res = await chatbotApi.get(`/vitals/alerts/doctor/${doctorId}`);
    return res.data;
  },

  async markAlertRead(alertId: string) {
    const res = await chatbotApi.put(`/vitals/alerts/${alertId}/read`);
    return res.data;
  },

  async deleteAlert(alertId: string) {
    const res = await chatbotApi.delete(`/vitals/alerts/${alertId}`);
    return res.data;
  },
};
