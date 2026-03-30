export interface PredecessorRow {
  id: string;
  name: string;
  predecessors: string[];
  duration: number;
}

export interface EventSequenceRow {
  id: string;
  name: string;
  duration: number;
  fromNode: string;
  toNode: string;
}

export type InputFormat = "predecessor" | "event-sequence";

export interface CpmActivity {
  name: string;
  duration: number;
  predecessors: string[];
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  R: number;
  isCritical: boolean;
}

export interface CpmResult {
  activities: CpmActivity[];
  projectDuration: number;
  criticalPath: string[];
  errors: string[];
}

export interface AppState {
  inputFormat: InputFormat;
  predecessorRows: PredecessorRow[];
  eventSequenceRows: EventSequenceRow[];
}