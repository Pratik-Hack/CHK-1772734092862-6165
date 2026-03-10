export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface PatientModel {
  id?: string;
  userId: string;
  emergencyContact: EmergencyContact;
  medications: Medication[];
  conditions: string[];
  linkedDoctorId?: string;
  dateOfBirth: string;
  bloodGroup: string;
  age?: number;
  gender?: string;
}

export interface PatientRegisterData {
  dateOfBirth: string;
  bloodGroup: string;
  emergencyContact: EmergencyContact;
  medications: Medication[];
  conditions: string[];
}
