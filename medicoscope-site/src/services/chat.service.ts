import { chatbotApi } from './api';
import type { ChatSession } from '@/models';

export const chatService = {
  async sendMessage(message: string, sessionId: string, patientProfile: Record<string, unknown>, language: string) {
    const res = await chatbotApi.post('/chat', {
      message, session_id: sessionId, patient_profile: patientProfile, language,
    });
    return res.data;
  },

  async saveMessage(data: { userId: string; message: string; response: string; sessionId?: string }) {
    const res = await chatbotApi.post('/chat/message', data);
    return res.data;
  },

  async getHistory(): Promise<ChatSession[]> {
    const res = await chatbotApi.get('/chat/history');
    return res.data;
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const res = await chatbotApi.get(`/chat/session/${sessionId}`);
    return res.data;
  },

  async deleteSession(sessionId: string) {
    const res = await chatbotApi.delete(`/chat/session/${sessionId}`);
    return res.data;
  },
};
