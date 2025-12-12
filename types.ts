export enum AppMode {
  ENCODE = 'ENCODE',
  DECODE = 'DECODE',
  HOME = 'HOME'
}

export interface StegoResult {
  success: boolean;
  message?: string;
  imageDataUrl?: string;
  error?: string;
}

export interface BattlePlan {
  title: string;
  content: string;
}
