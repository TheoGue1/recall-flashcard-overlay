export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  state: CardState;
  ease: number;
  interval: number;
  stepIndex: number;
  due: number;
  reps: number;
  lapses: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  timerEnabled: boolean;
  timerIntervalMinutes: number;
  timerCardCount: number;
  learningStepsMinutes: number[];
  graduatingIntervalDays: number;
  easyIntervalDays: number;
}

export interface AppSession {
  mandatoryActive: boolean;
  mandatoryRemaining: number;
  lastTimerFired: number | null;
}

export interface AppData {
  cards: Flashcard[];
  settings: AppSettings;
  session: AppSession;
}

export interface FlashApi {
  getData: () => Promise<AppData>;
  saveData: (data: AppData) => Promise<boolean>;
  pickCsv: () => Promise<string | null>;
  minimize: () => Promise<void>;
  close: () => Promise<{ blocked: boolean }>;
  triggerStudyBreak: () => Promise<boolean>;
  onTimerFired: (cb: (payload: { remaining: number }) => void) => () => void;
  onMandatoryBlocked: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    flashApi?: FlashApi;
  }
}
