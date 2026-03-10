import axios from 'axios';
import { API_BASE_URL, CHATBOT_API_URL, CARDIO_API_URL } from '@/lib/constants';

const createApiClient = (baseURL: string) => {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medicoscope-auth');
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return config;
  });

  return client;
};

export const mainApi = createApiClient(API_BASE_URL);
export const chatbotApi = createApiClient(CHATBOT_API_URL);
export const cardioApi = createApiClient(CARDIO_API_URL);
