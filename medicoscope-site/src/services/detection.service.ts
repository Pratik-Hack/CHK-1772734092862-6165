import { mainApi } from './api';
import type { DetectionRecord } from '@/models';

export const detectionService = {
  async saveDetection(data: Omit<DetectionRecord, 'id' | 'timestamp'>): Promise<DetectionRecord> {
    const res = await mainApi.post('/detections', data);
    return res.data;
  },

  async getPatientDetections(patientId: string): Promise<DetectionRecord[]> {
    const res = await mainApi.get(`/detections/${patientId}`);
    return res.data;
  },

  async getMyDetections(): Promise<DetectionRecord[]> {
    const res = await mainApi.get('/patients/records');
    return res.data;
  },
};
