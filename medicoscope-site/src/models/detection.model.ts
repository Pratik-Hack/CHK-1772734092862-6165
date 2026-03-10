export interface DetectionResult {
  className: string;
  confidence: number;
  description: string;
  model3dPath: string;
  category: 'skin' | 'chest' | 'brain';
  bboxX?: number;
  bboxY?: number;
  bboxWidth?: number;
  bboxHeight?: number;
}

export interface DetectionRecord {
  id?: string;
  _id?: string;
  className: string;
  confidence: number;
  category: string;
  description: string;
  patientId?: string;
  doctorId?: string;
  performedBy?: string | { _id: string; name: string; role: string };
  performedByName?: string;
  performedByRole?: string;
  timestamp?: string;
  createdAt?: string;
}
