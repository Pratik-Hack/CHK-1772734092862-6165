export interface UserModel {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
  uniqueCode: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'patient' | 'doctor';
}

export interface AuthResponse {
  token: string;
  user: UserModel;
}
