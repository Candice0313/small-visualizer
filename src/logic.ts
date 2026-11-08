import type { Conflict, Course, Day, Draft, Meeting, TimePattern } from "./types";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function courseSubject(name: string): string {
  const match = /^([A-Za-z]{2,8})\s+\d{3,4}\b/.exec(name.trim());
  return match ? match[1].toUpperCase() : "Other";
}

export function courseNumber(name: string): number {
  const match = /\s(\d{3,4})\b/.exec(name);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export const COLORS = [
  "#f7c7b8",
  "#c9ddf7",
  "#c9e7d4",
  "#f6c6d8",
  "#d9cef6",
  "#f6d7a6",
  "#bfe4dc",
  "#cdd4f6",
  "#e4c6f0",
  "#f6d2b4",
  "#c5e3f4",
];

const EXACT_LIMIT = 20;
const SEARCH_BUDGET = 100_000;

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatHours(mins: number): string {
  const hours = mins / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function parseTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function clock(mins: number, withSuffix: boolean): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 || 12;
  const text = `${h12}:${String(m).padStart(2, "0")}`;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return withSuffix ? `${text} ${suffix}` : text;
}

export function formatRange(start: number, end: number): string {
  const startSuffix = start >= 12 * 60 ? "PM" : "AM";
  const endSuffix = end >= 12 * 60 ? "PM" : "AM";
  if (startSuffix === endSuffix) return `${clock(start, false)}–${clock(end, true)}`;
  return `${clock(start, true)}–${clock(end, true)}`;
}

export function formatAxis(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 || 12;
  const suffix = h24 >= 12 ? "PM" : "AM";
  if (m === 0) return `${h12} ${suffix}`;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function meetingLabel(meeting: Pick<Meeting, "day" | "start" | "end">): string {
  return `${DAY_LABELS[meeting.day]} ${formatRange(meeting.start, meeting.end)}`;
}

export function meetingsOverlap(a: Meeting, b: Meeting): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

export function coursesOverlap(a: Course, b: Course): boolean {
  for (const left of a.meetings) {
    for (const right of b.meetings) {
      if (meetingsOverlap(left, right)) return true;
    }
  }
  return false;
}

export function findConflicts(courses: Course[]): Conflict[] {
  const selected = courses.filter((course) => course.selected);
  const conflicts: Conflict[] = [];
  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const a = selected[i];
      const b = selected[j];
      for (const left of a.meetings) {
        for (const right of b.meetings) {
          if (!meetingsOverlap(left, right)) continue;
          conflicts.push({
            aId: a.id,
            bId: b.id,
            aName: a.name,
            bName: b.name,
            day: left.day,
            start: Math.max(left.start, right.start),
            end: Math.min(left.end, right.end),
          });
        }
      }
    }
  }
  return conflicts;
}

export function meetingIsConflict(meeting: Meeting, courseId: string, courses: Course[]): boolean {
  for (const other of courses) {
    if (!other.selected || other.id === courseId) continue;
    for (const candidate of other.meetings) {
      if (meetingsOverlap(meeting, candidate)) return true;
    }
  }
  return false;
}

export function riskyCourseIds(courses: Course[]): Set<string> {
  const ids = new Set<string>();
  for (const course of courses) {
    if (course.selected) continue;
    if (courses.some((other) => other.selected && coursesOverlap(course, other))) ids.add(course.id);
  }
  return ids;
}

export function selectedMinutes(courses: Course[]): number {
  let total = 0;
  for (const course of courses) {
    if (!course.selected) continue;
    for (const meeting of course.meetings) total += meeting.end - meeting.start;
  }
  return total;
}

export function visibleRange(courses: Course[]): { start: number; end: number } {
  let start = 8 * 60;
  let end = 18 * 60;
  for (const course of courses) {
    for (const meeting of course.meetings) {
      start = Math.min(start, Math.floor(meeting.start / 60) * 60);
      end = Math.max(end, Math.ceil(meeting.end / 60) * 60);
    }
  }
  return { start: Math.max(0, start), end: Math.min(24 * 60, Math.max(end, start + 60)) };
}

export type LaidOut = {
  courseId: string;
  meeting: Meeting;
  lane: number;
  lanes: number;
};

export function layoutMeetings(items: { courseId: string; meeting: Meeting }[]): LaidOut[] {
  const sorted = items.slice().sort((a, b) => a.meeting.start - b.meeting.start || a.meeting.end - b.meeting.end);
  const laid: LaidOut[] = [];
  let cluster: { courseId: string; meeting: Meeting; lane: number }[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const lanes = cluster.reduce((max, item) => Math.max(max, item.lane + 1), 1);
    for (const item of cluster) laid.push({ ...item, lanes });
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.meeting.start >= clusterEnd) flush();
    const used = new Set<number>();
    for (const existing of cluster) {
      if (existing.meeting.end > item.meeting.start) used.add(existing.lane);
    }
    let lane = 0;
    while (used.has(lane)) lane += 1;
    cluster.push({ courseId: item.courseId, meeting: item.meeting, lane });
    clusterEnd = Math.max(clusterEnd, item.meeting.end);
  }
  flush();
  return laid;
}

type Score = { ids: string[]; count: number; minutes: number; kept: number };

function scoreOf(ids: string[], courses: Course[]): Score {
  const chosen = new Set(ids);
  let minutes = 0;
  let kept = 0;
  for (const course of courses) {
    if (!chosen.has(course.id)) continue;
    if (course.selected) kept += 1;
    for (const meeting of course.meetings) minutes += meeting.end - meeting.start;
  }
  return { ids, count: ids.length, minutes, kept };
}

function prefer(current: Score, next: Score): Score {
  if (next.count !== current.count) return next.count > current.count ? next : current;
  if (next.minutes !== current.minutes) return next.minutes > current.minutes ? next : current;
  if (next.kept !== current.kept) return next.kept > current.kept ? next : current;
  return current;
}

function greedyIds(courses: Course[]): string[] {
  const chosen: Course[] = [];
  const pinned = courses.filter((course) => course.pinned);
  chosen.push(...pinned);
  const rest = courses.filter((course) => !course.pinned);
  const degree = (course: Course) => rest.filter((other) => other.id !== course.id && coursesOverlap(course, other)).length;
  rest.sort((a, b) => degree(a) - degree(b) || b.meetings.reduce((sum, m) => sum + m.end - m.start, 0) - a.meetings.reduce((sum, m) => sum + m.end - m.start, 0));
  for (const course of rest) {
    if (chosen.every((kept) => !coursesOverlap(course, kept))) chosen.push(course);
  }
  return chosen.map((course) => course.id);
}

export function suggestSelection(courses: Course[]): { pinnedConflict: true } | { pinnedConflict: false; ids: string[] } {
  const pinned = courses.filter((course) => course.pinned);
  for (let i = 0; i < pinned.length; i += 1) {
    for (let j = i + 1; j < pinned.length; j += 1) {
      if (coursesOverlap(pinned[i], pinned[j])) return { pinnedConflict: true };
    }
  }

  const fallback = greedyIds(courses);
  if (courses.length > EXACT_LIMIT) return { pinnedConflict: false, ids: fallback };

  const conflictMask = new Array<number>(courses.length).fill(0);
  for (let i = 0; i < courses.length; i += 1) {
    for (let j = i + 1; j < courses.length; j += 1) {
      if (!coursesOverlap(courses[i], courses[j])) continue;
      conflictMask[i] |= 1 << j;
      conflictMask[j] |= 1 << i;
    }
  }

  const pinnedMask = pinned.reduce((mask, course) => {
    const index = courses.findIndex((item) => item.id === course.id);
    return mask | (1 << index);
  }, 0);

  const order = courses
    .map((course, index) => ({ index, pinned: course.pinned, degree: bitCount(conflictMask[index]) }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.degree - b.degree)
    .map((item) => item.index);

  let best = scoreOf(fallback, courses);
  let nodes = 0;

  const idsFromMask = (mask: number) => {
    const ids: string[] = [];
    for (let index = 0; index < courses.length; index += 1) {
      if ((mask & (1 << index)) !== 0) ids.push(courses[index].id);
    }
    return ids;
  };

  const search = (pos: number, mask: number, count: number) => {
    nodes += 1;
    if (nodes > SEARCH_BUDGET) return;
    if (count + (order.length - pos) < best.count) return;
    if (pos === order.length) {
      best = prefer(best, scoreOf(idsFromMask(mask), courses));
      return;
    }
    const index = order[pos];
    const bit = 1 << index;
    const must = (pinnedMask & bit) !== 0;
    const blocked = (mask & conflictMask[index]) !== 0;
    if (!blocked) search(pos + 1, mask | bit, count + 1);
    if (!must) search(pos + 1, mask, count);
  };

  search(0, 0, 0);
  return { pinnedConflict: false, ids: best.ids };
}

function bitCount(n: number): number {
  let count = 0;
  let value = n >>> 0;
  while (value) {
    count += value & 1;
    value >>>= 1;
  }
  return count;
}

export function nextColor(courses: Course[]): string {
  const used = new Set(courses.map((course) => course.color));
  return COLORS.find((color) => !used.has(color)) ?? COLORS[courses.length % COLORS.length];
}

export function emptyDraft(courses: Course[]): Draft {
  return {
    id: null,
    name: "",
    teacher: "",
    place: "",
    color: nextColor(courses),
    patterns: [{ days: [0, 2], start: "10:10", end: "11:25" }],
  };
}

export function draftFromCourse(course: Course): Draft {
  return {
    id: course.id,
    name: course.name,
    teacher: course.teacher,
    place: course.place,
    color: course.color,
    patterns: patternsFromMeetings(course.meetings),
  };
}

function patternsFromMeetings(meetings: Meeting[]): TimePattern[] {
  const groups = new Map<string, TimePattern>();
  const sorted = meetings.slice().sort((a, b) => a.start - b.start || a.end - b.end || a.day - b.day);
  for (const meeting of sorted) {
    const key = `${meeting.start}-${meeting.end}`;
    const existing = groups.get(key);
    if (existing) existing.days.push(meeting.day);
    else {
      groups.set(key, {
        days: [meeting.day],
        start: formatMinutes(meeting.start),
        end: formatMinutes(meeting.end),
      });
    }
  }
  for (const pattern of groups.values()) pattern.days.sort((a, b) => a - b);
  return [...groups.values()];
}

export function expandPatterns(patterns: TimePattern[]): { meetings: Meeting[] } | { error: string } {
  if (patterns.length === 0) return { error: "Add at least one meeting." };
  const meetings: Meeting[] = [];
  for (const pattern of patterns) {
    if (pattern.days.length === 0) return { error: "Each meeting needs at least one day." };
    const start = parseTime(pattern.start);
    const end = parseTime(pattern.end);
    if (start === null || end === null || end <= start) return { error: "The end time has to be later than the start." };
    for (const day of pattern.days) meetings.push({ day, start, end });
  }
  for (let i = 0; i < meetings.length; i += 1) {
    for (let j = i + 1; j < meetings.length; j += 1) {
      if (meetingsOverlap(meetings[i], meetings[j])) return { error: "This class overlaps itself." };
    }
  }
  meetings.sort((a, b) => a.day - b.day || a.start - b.start);
  return { meetings };
}

export function isDay(value: number): value is Day {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}
