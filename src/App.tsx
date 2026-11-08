import { useEffect, useMemo, useRef, useState } from "react";
import { CourseDialog } from "./components/CourseDialog";
import { CourseList } from "./components/CourseList";
import { Timetable } from "./components/Timetable";
import { draftFromCourse, emptyDraft, findConflicts, formatHours, riskyCourseIds, selectedMinutes, suggestSelection } from "./logic";
import { createSample } from "./sample";
import { loadCourses, saveCourses } from "./storage";
import type { Conflict, Course, Draft } from "./types";

export function App() {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses() ?? createSample());
  const [showGhosts, setShowGhosts] = useState(false);
  const [editor, setEditor] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollToCourse = useRef<string | null>(null);

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  useEffect(() => {
    const id = scrollToCourse.current;
    if (!id) return;
    scrollToCourse.current = null;
    const target = document.querySelector<HTMLElement>(`.block[data-course-id="${CSS.escape(id)}"]`);
    if (!target) return;
    const sheet = target.closest(".sheet");
    if (sheet) {
      const block = target.getBoundingClientRect();
      const view = sheet.getBoundingClientRect();
      const visible = block.top >= view.top + 36 && block.bottom <= view.bottom - 8;
      if (visible) return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [courses]);

  const toggleCourse = (id: string) => {
    setNotice(null);
    setCourses((current) =>
      current.map((course) => {
        if (course.id !== id) return course;
        const selected = !course.selected;
        if (selected) scrollToCourse.current = id;
        return { ...course, selected, pinned: selected ? course.pinned : false };
      }),
    );
  };

  const conflicts = useMemo(() => findConflicts(courses), [courses]);
  const riskyIds = useMemo(() => riskyCourseIds(courses), [courses]);
  const selectedCount = courses.filter((course) => course.selected).length;
  const minutes = selectedMinutes(courses);

  const reveal = (conflict: Conflict) => {
    const target = document.querySelector<HTMLElement>(
      `[data-course-id="${CSS.escape(conflict.aId)}"][data-day="${conflict.day}"]`,
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ block: "center", inline: "center", behavior: reduce ? "auto" : "smooth" });
  };

  const applySuggestion = () => {
    const result = suggestSelection(courses);
    if (result.pinnedConflict) {
      setNotice("Required classes overlap each other. Unpin one of them first.");
      return;
    }
    const ids = new Set(result.ids);
    setCourses((current) => current.map((course) => ({ ...course, selected: ids.has(course.id) })));
    setNotice(`Selected ${result.ids.length} classes with no overlaps.`);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div className="title">
            <h1>Course board</h1>
            <p>Cornell Tech · Spring 2027</p>
          </div>
        </div>
        <div className="top-actions">
          <div className="stats" aria-label="Current selection">
            <div>
              <strong>{selectedCount}</strong>
              <span>Selected</span>
            </div>
            <div>
              <strong>{formatHours(minutes)}</strong>
              <span>Hrs / week</span>
            </div>
            <div className={conflicts.length > 0 ? "bad" : "good"}>
              <strong>{conflicts.length}</strong>
              <span>Overlaps</span>
            </div>
          </div>
          <div className="buttons">
            <button type="button" className="btn ghost" onClick={applySuggestion} disabled={courses.length === 0}>
              Fit without overlaps
            </button>
            <button type="button" className="btn ink" onClick={() => setEditor(emptyDraft(courses))}>
              Add class
            </button>
          </div>
          <p className="notice" role="status">
            {notice ?? ""}
          </p>
        </div>
      </header>
      <div className="workspace">
        <CourseList
          courses={courses}
          conflicts={conflicts}
          riskyIds={riskyIds}
          onToggle={toggleCourse}
          onPin={(id) => {
            setNotice(null);
            setCourses((current) =>
              current.map((course) => {
                if (course.id !== id) return course;
                const pinned = !course.pinned;
                return { ...course, pinned, selected: pinned ? true : course.selected };
              }),
            );
          }}
          onEdit={(course) => setEditor(draftFromCourse(course))}
          onDelete={(id) => {
            setNotice(null);
            setCourses((current) => current.filter((course) => course.id !== id));
          }}
          onReveal={reveal}
          onReset={() => {
            setCourses(createSample());
            setNotice("CS roster restored.");
          }}
        />
        <Timetable
          courses={courses}
          showGhosts={showGhosts}
          riskyIds={riskyIds}
          onToggle={toggleCourse}
          onShowGhosts={setShowGhosts}
        />
      </div>
      {editor ? (
        <CourseDialog
          key={editor.id ?? "new"}
          initial={editor}
          onClose={() => setEditor(null)}
          onSubmit={(input) => {
            setCourses((current) => {
              if (input.id) {
                return current.map((course) =>
                  course.id === input.id
                    ? { ...course, name: input.name, teacher: input.teacher, place: input.place, color: input.color, meetings: input.meetings }
                    : course,
                );
              }
              return [
                ...current,
                {
                  id: crypto.randomUUID(),
                  name: input.name,
                  teacher: input.teacher,
                  place: input.place,
                  color: input.color,
                  meetings: input.meetings,
                  selected: true,
                  pinned: false,
                },
              ];
            });
            setEditor(null);
            setNotice(null);
          }}
        />
      ) : null}
    </div>
  );
}
