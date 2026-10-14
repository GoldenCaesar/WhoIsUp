export interface RepItem {
  id: string;
  name: string;
  checked: boolean;
  status: 'available' | 'busy' | 'appointment' | 'break';
  upCount: number;
  statusChangedAt: number;
  note?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  text: string;
  type: 'walkin' | 'appointment' | 'toggle' | 'add' | 'remove' | 'reorder' | 'reset' | 'undo';
  repName?: string;
}

export interface QueueState {
  reps: RepItem[];
  activity: ActivityEvent[];
  presets: string[];
  lastResetDate?: string;
  autoResetEnabled?: boolean;
  timezone?: string;
}
