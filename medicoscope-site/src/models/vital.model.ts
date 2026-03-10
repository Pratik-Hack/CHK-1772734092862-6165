export interface VitalDataPoint {
  tick?: number;
  timestamp: string;
  heartRate: number;
  bloodPressure?: { systolic: number; diastolic: number };
  systolic?: number;
  diastolic?: number;
  spO2: number;
  temperature?: number;
}

export interface VitalAlert {
  _id?: string;
  id?: string;
  type?: string;
  vitalType?: string;
  severity: string;
  message: string;
  vital?: string;
  currentValue?: number;
  predictedValue?: number;
  value?: number;
  threshold?: number;
  unit?: string;
  timestamp?: string;
  createdAt?: string;
  patientName?: string;
  patientId?: string;
  read?: boolean;
}

export interface VitalsSession {
  sessionId: string;
  patientId: string;
  doctorId?: string;
  startTime?: string;
}
