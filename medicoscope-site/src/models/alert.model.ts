export interface MindSpaceSession {
  id?: string;
  patientId: string;
  patientName: string;
  transcript: string;
  urgency: string;
  coinsEarned: number;
  doctorReport: string;
  timestamp: string;
}

export interface MindSpaceNotification {
  id?: string;
  patientId: string;
  patientName: string;
  urgency: string;
  transcript: string;
  doctorReport: string;
  timestamp: string;
  read?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  totalCoins: number;
  totalSessions: number;
  currentStreak: number;
  lastSessionDate?: string;
}

export interface ClaimedReward {
  id?: string;
  rewardType: string;
  title: string;
  content: string;
  coinsCost: number;
  claimedAt: string;
}

export interface NearbyDoctor {
  id?: string;
  name: string;
  specialization: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}
