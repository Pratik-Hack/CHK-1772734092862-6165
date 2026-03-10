import { mainApi } from './api';
import type { DetectionRecord } from '@/models';

export const detectionService = {
  async analyzeImage(imageFile: File, category: string): Promise<DetectionRecord> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('category', category);
    const res = await mainApi.post('/detections/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const d = res.data;
    return d?.detection ?? d?.result ?? d;
  },

  async saveDetection(data: Omit<DetectionRecord, 'id' | 'timestamp'>): Promise<DetectionRecord> {
    const res = await mainApi.post('/detections', data);
    return res.data;
  },

  async getPatientDetections(patientId: string): Promise<DetectionRecord[]> {
    const res = await mainApi.get(`/detections/${patientId}`);
    const d = res.data;
    return Array.isArray(d) ? d : d?.detections ?? d?.records ?? d?.data ?? [];
  },

  async getMyDetections(): Promise<DetectionRecord[]> {
    const res = await mainApi.get('/patients/records');
    const d = res.data;
    return Array.isArray(d) ? d : d?.records ?? d?.detections ?? d?.data ?? [];
  },
};
