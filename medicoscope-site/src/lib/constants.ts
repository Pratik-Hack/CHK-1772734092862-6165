export const API_BASE_URL = 'https://medicoscope-server.onrender.com/api';
export const CHATBOT_API_URL = 'https://medicoscope-chatbot-mu7p.onrender.com';
export const CARDIO_API_URL = 'https://cardio-l3eb.onrender.com';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const SCAN_CATEGORIES = ['Chest X-Ray', 'Brain MRI', 'Skin Lesion'] as const;

export const REWARD_ITEMS = [
  { id: 'yoga', name: 'Yoga & Meditation Videos', cost: 50, icon: '🧘', description: 'Guided yoga and meditation sessions for stress relief and wellness.' },
  { id: 'nutrition', name: 'Nutrition Plans', cost: 40, icon: '🥗', description: 'Personalized nutrition guides for a healthier lifestyle.' },
  { id: 'articles', name: 'Wellness Articles', cost: 30, icon: '📖', description: 'Curated health and wellness articles from medical experts.' },
  { id: 'sleep', name: 'Sleep Guides', cost: 35, icon: '😴', description: 'Better sleep techniques and bedtime routines.' },
] as const;

export const VITAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: 'BPM', label: 'Heart Rate' },
  systolic: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic BP' },
  diastolic: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic BP' },
  spo2: { min: 95, max: 100, unit: '%', label: 'SpO2' },
} as const;
