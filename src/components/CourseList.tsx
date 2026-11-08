import { courseNumber, courseSubject, meetingLabel } from "../logic";
import type { Conflict, Course } from "../types";

type Props = {
  courses: Course[];
  conflicts: Conflict[];
  riskyIds: Set<string>;
  onToggle: (id: string) => void;
  onPin: (id: string) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onReveal: (conflict: Conflict) => void;
  onReset: () => void;
};

export function CourseList({
  courses,
  conflicts,
  riskyIds,
  onToggle,
  onPin,
  onEdit,
  onDelete,
  onReveal,
  onReset,
}: Props) {
  const groups = groupCourses(courses);
  return (
    <aside className="sidebar">
      <div className="side-head">
        <h2>Classes</h2>
        <span>{courses.length}</span>
      </div>
      <div className="course-scroll">
        {conflicts.length > 0 ? (
          <section className="conflicts" aria-label="Overlaps">
            <h3>These overlap</h3>
            {conflicts.map((conflict) => (
              <button
                key={`${conflict.aId}-${conflict.bId}-${conflict.day}-${conflict.start}`}
                type="button"
                className="conflict"
                onClick={() => onReveal(conflict)}
              >
                <span>
                  {conflict.aName} and {conflict.bName}
                </span>
                <span>{meetingLabel(conflict)}</span>
              </button>
            ))}
          </section>
        ) : (
          <p className="clear">Nothing you selected overlaps.</p>
        )}
        {courses.length === 0 ? <p className="empty">No classes yet. Add one, or restore the CS roster.</p> : null}
        {groups.map((group) => (
          <section key={group.subject} className="subject-group" aria-label={group.subject}>
            <h3 className="subject-head">
              {group.subject}
              <span>{group.courses.length}</span>
            </h3>
            {group.courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                conflicts={conflicts}
                risky={riskyIds.has(course.id)}
                onToggle={onToggle}
                onPin={onPin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </section>
        ))}
      </div>
      <footer className="side-foot">
        <button type="button" className="text-btn" onClick={onReset}>
          Restore CS roster
        </button>
        <a
          className="source"
          href="https://classes.cornell.edu/search/roster/SP27?q=&days-type=any&campus%5B%5D=NYT&distrReqs-type=any&explStudies-type=any&pi="
          target="_blank"
          rel="noreferrer"
        >
          Spring 2027 Cornell Tech roster
        </a>
      </footer>
    </aside>
  );
}

function CourseRow({
  course,
  conflicts,
  risky,
  onToggle,
  onPin,
  onEdit,
  onDelete,
}: {
  course: Course;
  conflicts: Conflict[];
  risky: boolean;
  onToggle: (id: string) => void;
  onPin: (id: string) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}) {
  const detail = [course.teacher, course.place].filter(Boolean).join(" · ");
  const hot = course.selected && conflicts.some((conflict) => conflict.aId === course.id || conflict.bId === course.id);
  return (
    <article className={hot ? "course hot" : "course"} style={{ ["--c" as string]: course.color }}>
      <button type="button" className="course-main" aria-pressed={course.selected} onClick={() => onToggle(course.id)}>
        <span className="box" aria-hidden="true" />
        <span className="course-copy">
          <span className="course-name">{course.name}</span>
          {detail ? <span className="meta">{detail}</span> : null}
          {course.meetings.map((meeting) => (
            <span key={`${meeting.day}-${meeting.start}`} className="when">
              {meetingLabel(meeting)}
            </span>
          ))}
          {hot ? <span className="warn">Overlaps another selected class</span> : null}
          {risky ? <span className="warn">Selecting this overlaps a class you picked</span> : null}
        </span>
      </button>
      <div className="course-actions">
        <button type="button" aria-pressed={course.pinned} onClick={() => onPin(course.id)}>
          {course.pinned ? "Required" : "Require"}
        </button>
        <button type="button" onClick={() => onEdit(course)}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(course.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function groupCourses(courses: Course[]): { subject: string; courses: Course[] }[] {
  const groups = new Map<string, Course[]>();
  const sorted = courses.slice().sort((a, b) => {
    const subject = courseSubject(a.name).localeCompare(courseSubject(b.name));
    if (subject !== 0) return subject;
    return courseNumber(a.name) - courseNumber(b.name) || a.name.localeCompare(b.name);
  });
  for (const course of sorted) {
    const subject = courseSubject(course.name);
    const list = groups.get(subject);
    if (list) list.push(course);
    else groups.set(subject, [course]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    })
    .map(([subject, list]) => ({ subject, courses: list }));
}
