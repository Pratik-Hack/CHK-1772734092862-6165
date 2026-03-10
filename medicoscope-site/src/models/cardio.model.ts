export interface CardioResult {
  prediction: string;
  avg_heart_rate: number;
  heart_rate_data: { time: number; bpm: number }[];
  audio_waveform: { time: number[]; amplitude: number[] };
  ecg_data: number[];
}
