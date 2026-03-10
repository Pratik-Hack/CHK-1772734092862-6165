export interface CardioResult {
  prediction: string;
  avgHeartRate: number;
  heartRateData: { time: number; bpm: number }[];
  audioWaveform: { time: number[]; amplitude: number[] };
  ecgData: number[];
}
