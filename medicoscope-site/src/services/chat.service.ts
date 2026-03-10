import { chatbotApi, mainApi } from './api';
import type { ChatSession } from '@/models';

export const chatService = {
  async sendMessage(message: string, sessionId: string, patientProfile: Record<string, unknown>, language: string) {
    const res = await chatbotApi.post('/chat', {
      message, session_id: sessionId, patient_profile: patientProfile, language,
    });
    return res.data;
  },

  async saveMessage(data: { userId: string; message: string; response: string; sessionId?: string }) {
    const res = await mainApi.post('/chat/message', data);
    return res.data;
  },

  async getHistory(): Promise<ChatSession[]> {
    const res = await mainApi.get('/chat/history');
    const d = res.data;
    return Array.isArray(d) ? d : d?.sessions ?? d?.history ?? d?.data ?? [];
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const res = await mainApi.get(`/chat/session/${sessionId}`);
    return res.data;
  },

  async deleteSession(sessionId: string) {
    const res = await mainApi.delete(`/chat/session/${sessionId}`);
    return res.data;
  },
};
