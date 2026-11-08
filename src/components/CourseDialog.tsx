import { useId, useState } from "react";
import { COLORS, DAY_LABELS, expandPatterns } from "../logic";
import type { Day, Draft, Meeting } from "../types";

const SLOTS = [
  { label: "8:40–9:55", start: "08:40", end: "09:55" },
  { label: "10:10–11:25", start: "10:10", end: "11:25" },
  { label: "11:40–12:55", start: "11:40", end: "12:55" },
  { label: "1:25–2:40", start: "13:25", end: "14:40" },
  { label: "2:55–4:10", start: "14:55", end: "16:10" },
  { label: "4:20–5:35", start: "16:20", end: "17:35" },
];

type Submit = {
  id: string | null;
  name: string;
  teacher: string;
  place: string;
  color: string;
  meetings: Meeting[];
};

type Props = {
  initial: Draft;
  onClose: () => void;
  onSubmit: (course: Submit) => void;
};

export function CourseDialog({ initial, onClose, onSubmit }: Props) {
  const formId = useId();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const updatePattern = (index: number, patch: Partial<Draft["patterns"][number]>) => {
    setDraft((current) => ({
      ...current,
      patterns: current.patterns.map((pattern, patternIndex) => (patternIndex === index ? { ...pattern, ...patch } : pattern)),
    }));
  };

  const toggleDay = (index: number, day: Day) => {
    setDraft((current) => ({
      ...current,
      patterns: current.patterns.map((pattern, patternIndex) => {
        if (patternIndex !== index) return pattern;
        const days = pattern.days.includes(day)
          ? pattern.days.filter((item) => item !== day)
          : [...pattern.days, day].sort((a, b) => a - b);
        return { ...pattern, days };
      }),
    }));
  };

  const submit = () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Add a class name first.");
      return;
    }
    const expanded = expandPatterns(draft.patterns);
    if ("error" in expanded) {
      setError(expanded.error);
      return;
    }
    onSubmit({
      id: draft.id,
      name,
      teacher: draft.teacher.trim(),
      place: draft.place.trim(),
      color: draft.color,
      meetings: expanded.meetings,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <h2 id={`${formId}-title`}>{draft.id ? "Edit class" : "Add class"}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label htmlFor={`${formId}-name`}>Class name</label>
          <input
            id={`${formId}-name`}
            type="text"
            autoFocus
            maxLength={160}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <div className="split">
            <div>
              <label htmlFor={`${formId}-teacher`}>Instructor</label>
              <input
                id={`${formId}-teacher`}
                type="text"
                maxLength={20}
                value={draft.teacher}
                onChange={(event) => setDraft({ ...draft, teacher: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-place`}>Location</label>
              <input
                id={`${formId}-place`}
                type="text"
                maxLength={30}
                value={draft.place}
                onChange={(event) => setDraft({ ...draft, place: event.target.value })}
              />
            </div>
          </div>
          <span className="field-label">Color</span>
          <div className="swatches" role="group" aria-label="Color">
            {COLORS.map((color, index) => (
              <button
                key={color}
                type="button"
                className="swatch"
                style={{ background: color }}
                aria-label={`Color ${index + 1}`}
                aria-pressed={draft.color === color}
                onClick={() => setDraft({ ...draft, color })}
              />
            ))}
          </div>
          {draft.patterns.map((pattern, index) => (
            <fieldset key={index} className="pattern">
              <legend>Meeting {draft.patterns.length > 1 ? index + 1 : ""}</legend>
              <div className="day-row" role="group" aria-label="Days">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    className="day-chip"
                    aria-label={label}
                    aria-pressed={pattern.days.includes(day as Day)}
                    onClick={() => toggleDay(index, day as Day)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="slot-row">
                {SLOTS.map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    className="slot"
                    aria-pressed={pattern.start === slot.start && pattern.end === slot.end}
                    onClick={() => updatePattern(index, { start: slot.start, end: slot.end })}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <div className="split">
                <div>
                  <label htmlFor={`${formId}-start-${index}`}>Start</label>
                  <input
                    id={`${formId}-start-${index}`}
                    type="time"
                    step={300}
                    value={pattern.start}
                    onChange={(event) => updatePattern(index, { start: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-end-${index}`}>End</label>
                  <input
                    id={`${formId}-end-${index}`}
                    type="time"
                    step={300}
                    value={pattern.end}
                    onChange={(event) => updatePattern(index, { end: event.target.value })}
                  />
                </div>
              </div>
              {draft.patterns.length > 1 ? (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    setDraft((current) => ({ ...current, patterns: current.patterns.filter((_, patternIndex) => patternIndex !== index) }))
                  }
                >
                  Remove this meeting
                </button>
              ) : null}
            </fieldset>
          ))}
          <button
            type="button"
            className="text-btn add-pattern"
            onClick={() =>
              setDraft((current) => {
                const last = current.patterns[current.patterns.length - 1];
                const nextDay = ((last.days[0] ?? 0) + 1) % 7;
                return {
                  ...current,
                  patterns: [...current.patterns, { days: [nextDay as Day], start: last.start, end: last.end }],
                };
              })
            }
          >
            Add another meeting
          </button>
          <p className="hint">These are Cornell’s usual class periods. Change the times if a class runs longer.</p>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="btn line" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn ink">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
