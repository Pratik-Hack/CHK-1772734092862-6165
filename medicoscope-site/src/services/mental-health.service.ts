import { chatbotApi, mainApi } from './api';
import type { MindSpaceSession, MindSpaceNotification } from '@/models';

export const mentalHealthService = {
  async analyze(audioFile: File | Blob, patientId: string, patientName?: string, doctorId?: string) {
    const formData = new FormData();
    formData.append('audio', audioFile, 'recording.webm');
    formData.append('patient_id', patientId);
    if (patientName) formData.append('patient_name', patientName);
    if (doctorId) formData.append('doctor_id', doctorId);
    const res = await chatbotApi.post('/mental-health/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const d = res.data;
    return d?.result ?? d?.analysis ?? d;
  },

  async saveSession(data: Record<string, unknown>) {
    const res = await mainApi.post('/mindspace/session', data);
    return res.data;
  },

  async getHistory(): Promise<MindSpaceSession[]> {
    const res = await mainApi.get('/mindspace/history');
    const d = res.data;
    return Array.isArray(d) ? d : d?.sessions ?? d?.history ?? d?.data ?? [];
  },

  async deleteSession(sessionId: string) {
    const res = await mainApi.delete(`/mindspace/session/${sessionId}`);
    return res.data;
  },

  async getDoctorNotifications(doctorId: string): Promise<MindSpaceNotification[]> {
    const res = await mainApi.get(`/mental-health/notifications/${doctorId}`);
    const d = res.data;
    return Array.isArray(d) ? d : d?.notifications ?? d?.data ?? [];
  },
};
