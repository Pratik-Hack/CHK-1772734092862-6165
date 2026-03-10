export interface DoctorModel {
  id?: string;
  _id?: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  linkedPatientIds?: string[];
  linkedPatients?: string[];
  yearsOfExperience: number;
}

export interface DoctorRegisterData {
  specialization: string;
  licenseNumber: string;
  hospital: string;
  yearsOfExperience: number;
}
