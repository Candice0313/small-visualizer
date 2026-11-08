import {
  DAY_LABELS,
  formatAxis,
  formatRange,
  layoutMeetings,
  meetingIsConflict,
  visibleRange,
} from "../logic";
import type { Course, Day } from "../types";

const HOUR_PX = 78;
const DAYS: Day[] = [0, 1, 2, 3, 4, 5, 6];

type Props = {
  courses: Course[];
  showGhosts: boolean;
  riskyIds: Set<string>;
  onToggle: (id: string) => void;
  onShowGhosts: (value: boolean) => void;
};

export function Timetable({ courses, showGhosts, riskyIds, onToggle, onShowGhosts }: Props) {
  const range = visibleRange(showGhosts ? courses : courses.filter((course) => course.selected));
  const hours: number[] = [];
  for (let minute = range.start; minute < range.end; minute += 60) hours.push(minute);
  const bodyHeight = hours.length * HOUR_PX;
  const days = DAYS.filter(
    (day) => day < 5 || courses.some((course) => course.meetings.some((meeting) => meeting.day === day)),
  );

  return (
    <section className="timetable" aria-label="Weekly schedule">
      <div className="sheet-bar">
        <h2>Week</h2>
        <label className="check">
          <input type="checkbox" checked={showGhosts} onChange={(event) => onShowGhosts(event.target.checked)} />
          Show unselected
        </label>
      </div>
      <div className="sheet">
        <div
          className="sheet-grid"
          style={{
            ["--hour" as string]: `${HOUR_PX}px`,
            gridTemplateRows: `auto ${bodyHeight}px`,
            gridTemplateColumns: `72px repeat(${days.length}, minmax(132px, 1fr))`,
          }}
        >
          <div className="corner">Time</div>
          {days.map((day) => (
            <div key={day} className={day >= 5 ? "day-head weekend" : "day-head"}>
              {DAY_LABELS[day]}
            </div>
          ))}
          <div className="times">
            {hours.map((minute, index) => (
              <span key={minute} className="tick" style={{ top: index * HOUR_PX + 6 }}>
                {formatAxis(minute)}
              </span>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn
              key={day}
              day={day}
              courses={courses}
              rangeStart={range.start}
              showGhosts={showGhosts}
              riskyIds={riskyIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayColumn({
  day,
  courses,
  rangeStart,
  showGhosts,
  riskyIds,
  onToggle,
}: {
  day: Day;
  courses: Course[];
  rangeStart: number;
  showGhosts: boolean;
  riskyIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const selected = courses.flatMap((course) =>
    course.selected
      ? course.meetings.filter((meeting) => meeting.day === day).map((meeting) => ({ courseId: course.id, meeting }))
      : [],
  );
  const laid = layoutMeetings(selected);
  const ghosts = showGhosts
    ? layoutMeetings(
        courses.flatMap((course) =>
          course.selected
            ? []
            : course.meetings
                .filter((meeting) => meeting.day === day)
                .map((meeting) => ({ courseId: course.id, meeting })),
        ),
      )
    : [];

  return (
    <div className={day >= 5 ? "day-col weekend" : "day-col"}>
      {ghosts.map((item) => {
        const course = courses.find((candidate) => candidate.id === item.courseId);
        if (!course) return null;
        return (
          <Block
            key={`${course.id}-${item.meeting.start}`}
            course={course}
            start={item.meeting.start}
            end={item.meeting.end}
            rangeStart={rangeStart}
            day={day}
            ghost
            risky={riskyIds.has(course.id)}
            conflict={false}
            lane={item.lane}
            lanes={item.lanes}
            onToggle={onToggle}
          />
        );
      })}
      {laid.map((item) => {
        const course = courses.find((candidate) => candidate.id === item.courseId);
        if (!course) return null;
        return (
          <Block
            key={`${item.courseId}-${item.meeting.start}`}
            course={course}
            start={item.meeting.start}
            end={item.meeting.end}
            rangeStart={rangeStart}
            day={day}
            ghost={false}
            risky={false}
            conflict={meetingIsConflict(item.meeting, course.id, courses)}
            lane={item.lane}
            lanes={item.lanes}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}

function Block({
  course,
  start,
  end,
  rangeStart,
  day,
  ghost,
  risky,
  conflict,
  lane,
  lanes,
  onToggle,
}: {
  course: Course;
  start: number;
  end: number;
  rangeStart: number;
  day: Day;
  ghost: boolean;
  risky: boolean;
  conflict: boolean;
  lane: number;
  lanes: number;
  onToggle: (id: string) => void;
}) {
  const top = ((start - rangeStart) / 60) * HOUR_PX + 2;
  const height = Math.max(((end - start) / 60) * HOUR_PX - 4, 28);
  const className = ["block", ghost ? "ghost" : "solid", conflict ? "conflict" : "", risky ? "risky" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      style={{
        top,
        height,
        left: `calc(${(lane / lanes) * 100}% + 3px)`,
        width: `calc(${100 / lanes}% - 6px)`,
        ["--c" as string]: course.color,
      }}
      data-course-id={course.id}
      data-day={day}
      data-selected={course.selected ? "true" : "false"}
      data-conflict={conflict ? "true" : "false"}
      aria-pressed={course.selected}
      title={`${course.name} ${formatRange(start, end)}`}
      onClick={() => onToggle(course.id)}
    >
      {conflict ? <span className="badge">Overlap</span> : null}
      {risky ? <span className="badge">Clash</span> : null}
      <strong>{course.name}</strong>
      {height >= 52 ? <span>{formatRange(start, end)}</span> : null}
    </button>
  );
}
