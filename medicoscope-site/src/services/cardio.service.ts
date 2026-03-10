import { cardioApi } from './api';
import type { CardioResult } from '@/models';

export const cardioService = {
  async analyzeHeartSound(audioFile: File | Blob): Promise<CardioResult> {
    const formData = new FormData();
    const name = audioFile instanceof File ? audioFile.name : 'recording.wav';
    formData.append('audio_file', audioFile, name);
    const res = await cardioApi.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    const d = res.data;
    return d?.result ?? d;
  },
};
