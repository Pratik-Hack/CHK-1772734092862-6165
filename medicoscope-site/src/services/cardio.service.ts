import { cardioApi } from './api';
import type { CardioResult } from '@/models';

export const cardioService = {
  async analyzeHeartSound(audioFile: File | Blob): Promise<CardioResult> {
    const formData = new FormData();
    formData.append('audio_file', audioFile, 'recording.wav');
    const res = await cardioApi.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
