import { chatbotApi } from './api';
import type { MindSpaceSession, MindSpaceNotification } from '@/models';

export const mentalHealthService = {
  async analyze(audioFile: File | Blob, patientId: string) {
    const formData = new FormData();
    formData.append('audio', audioFile, 'recording.webm');
    formData.append('patient_id', patientId);
    const res = await chatbotApi.post('/mental-health/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async saveSession(data: Record<string, unknown>) {
    const res = await chatbotApi.post('/mindspace/session', data);
    return res.data;
  },

  async getHistory(): Promise<MindSpaceSession[]> {
    const res = await chatbotApi.get('/mindspace/history');
    return res.data;
  },

  async deleteSession(sessionId: string) {
    const res = await chatbotApi.delete(`/mindspace/session/${sessionId}`);
    return res.data;
  },

  async getDoctorNotifications(doctorId: string): Promise<MindSpaceNotification[]> {
    const res = await chatbotApi.get(`/mental-health/notifications/${doctorId}`);
    return res.data;
  },
};
