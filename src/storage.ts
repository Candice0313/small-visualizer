import { COLORS, isDay } from "./logic";
import type { Course, Meeting } from "./types";

const KEY = "small-visualizer:courses:v3";
const HEX = /^#[0-9a-fA-F]{6}$/;

// Earlier builds stored dark pigments and mixed them into the page. Swap those for the light fills.
const LEGACY_COLORS: Record<string, string> = {
  "#e4572e": "#f7c7b8",
  "#2f6f8f": "#c9ddf7",
  "#3f6b4e": "#c9e7d4",
  "#8a4e68": "#f6c6d8",
  "#6b5a96": "#d9cef6",
  "#a1622f": "#f6d7a6",
  "#1f6f6a": "#bfe4dc",
  "#3d4f8a": "#cdd4f6",
  "#6a7428": "#e4c6f0",
  "#8d4a32": "#f6d2b4",
  "#3d5a80": "#c5e3f4",
};

export function loadCourses(): Course[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const courses: Course[] = [];
    const ids = new Set<string>();
    for (const item of parsed) {
      const course = parseCourse(item);
      if (!course || ids.has(course.id)) return null;
      ids.add(course.id);
      courses.push(course);
    }
    return courses;
  } catch {
    return null;
  }
}

export function saveCourses(courses: Course[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses));
  } catch {
    // Ignore quota and private-mode failures. The table still works for this visit.
  }
}

function parseCourse(value: unknown): Course | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.name !== "string" || record.name.trim() === "") return null;
  if (!Array.isArray(record.meetings) || record.meetings.length === 0) return null;
  const meetings: Meeting[] = [];
  for (const item of record.meetings) {
    const meeting = parseMeeting(item);
    if (!meeting) return null;
    meetings.push(meeting);
  }
  const pinned = record.pinned === true;
  return {
    id: record.id,
    name: record.name,
    teacher: typeof record.teacher === "string" ? record.teacher : "",
    place: typeof record.place === "string" ? record.place : "",
    color: typeof record.color === "string" && HEX.test(record.color) ? freshColor(record.color) : COLORS[0],
    meetings,
    pinned,
    selected: pinned || record.selected === true,
  };
}

function freshColor(value: string): string {
  return LEGACY_COLORS[value.toLowerCase()] ?? value;
}

function parseMeeting(value: unknown): Meeting | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.day !== "number" || !isDay(record.day)) return null;
  if (typeof record.start !== "number" || typeof record.end !== "number") return null;
  if (record.start < 0 || record.end > 24 * 60 || record.end <= record.start) return null;
  return { day: record.day, start: record.start, end: record.end };
}
