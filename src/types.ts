export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Meeting = {
  day: Day;
  start: number;
  end: number;
};

export type Course = {
  id: string;
  name: string;
  teacher: string;
  place: string;
  color: string;
  meetings: Meeting[];
  selected: boolean;
  pinned: boolean;
};

export type TimePattern = {
  days: Day[];
  start: string;
  end: string;
};

export type Draft = {
  id: string | null;
  name: string;
  teacher: string;
  place: string;
  color: string;
  patterns: TimePattern[];
};

export type Conflict = {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  day: Day;
  start: number;
  end: number;
};
