import { useCallback, useEffect, useMemo, useState } from "react";
import { useGoogle } from "../context/GoogleContext";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type CalendarEvent,
} from "../lib/google";
import { formatTime, isSameDay, toTimeInput, WEEKDAYS_JA } from "../lib/datetime";
import JoinButtons from "../components/JoinButtons";

type View = "month" | "week";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** 月表示用に 6 週 × 7 日 = 42 セルの日付配列を作る。 */
function buildCalendarDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** day を含む週（日曜始まり）の 7 日分。 */
function buildWeekDays(day: Date): Date[] {
  const start = addDays(day, -day.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function Schedule() {
  const { ready, signedIn, signIn } = useGoogle();
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 追加 / 編集フォーム（editingId が null なら新規追加）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [addMeet, setAddMeet] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setSummary("");
    setStartTime("10:00");
    setEndTime("11:00");
    setAddMeet(false);
  };

  const startEdit = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setSummary(ev.summary);
    setStartTime(toTimeInput(ev.start));
    setEndTime(toTimeInput(ev.end));
    setAddMeet(false);
  };

  const monthDays = useMemo(() => buildCalendarDays(month), [month]);
  const weekDays = useMemo(() => buildWeekDays(selected), [selected]);

  // 月グリッド（6週分）を一括取得しておけば、その月内の週ビューもまかなえる
  const loadMonth = useCallback(() => {
    if (!signedIn) {
      setEvents([]);
      return;
    }
    const grid = buildCalendarDays(month);
    const timeMin = new Date(grid[0]);
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(grid[grid.length - 1]);
    timeMax.setHours(23, 59, 59, 999);

    setLoading(true);
    setError(null);
    listEvents(timeMin, timeMax)
      .then(setEvents)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "予定の取得に失敗しました")
      )
      .finally(() => setLoading(false));
  }, [month, signedIn]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const eventsOf = useCallback(
    (day: Date) =>
      events
        .filter((e) => isSameDay(e.start, day))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events]
  );

  const selectedEvents = eventsOf(selected);

  const goPrev = () => {
    if (view === "month") {
      setMonth(addMonths(month, -1));
    } else {
      const d = addDays(selected, -7);
      setSelected(d);
      setMonth(startOfMonth(d));
    }
  };

  const goNext = () => {
    if (view === "month") {
      setMonth(addMonths(month, 1));
    } else {
      const d = addDays(selected, 7);
      setSelected(d);
      setMonth(startOfMonth(d));
    }
  };

  const pickDay = (day: Date) => {
    setSelected(new Date(day));
    setMonth(startOfMonth(day));
  };

  const handleSubmit = async () => {
    if (!summary.trim()) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = new Date(selected);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(selected);
    end.setHours(eh, em, 0, 0);

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateEvent({ id: editingId, summary: summary.trim(), start, end });
      } else {
        await createEvent({ summary: summary.trim(), start, end, addMeet });
      }
      resetForm();
      loadMonth();
    } catch (e: unknown) {
      const fallback = editingId
        ? "予定の更新に失敗しました"
        : "予定の作成に失敗しました";
      setError(e instanceof Error ? e.message : fallback);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この予定を削除しますか？")) return;
    setError(null);
    try {
      await deleteEvent(id);
      loadMonth();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "予定の削除に失敗しました");
    }
  };

  const today = new Date();

  if (!signedIn) {
    return (
      <div className="card schedule-login">
        <p className="muted">
          スケジュール帳を使うには Google カレンダーへのログインが必要です。
        </p>
        <button className="btn" disabled={!ready} onClick={signIn}>
          Googleでログイン
        </button>
      </div>
    );
  }

  const headerTitle =
    view === "month"
      ? `${month.getFullYear()}年 ${month.getMonth() + 1}月`
      : `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()} 〜 ${
          weekDays[6].getMonth() + 1
        }/${weekDays[6].getDate()}`;

  return (
    <div className="schedule">
      <div className="calendar card">
        <div className="calendar-head">
          <button className="icon-btn" onClick={goPrev}>
            ‹
          </button>
          <div className="calendar-title">{headerTitle}</div>
          <button className="icon-btn" onClick={goNext}>
            ›
          </button>
          <div className="view-toggle">
            <button
              className={view === "month" ? "active" : ""}
              onClick={() => setView("month")}
            >
              月
            </button>
            <button
              className={view === "week" ? "active" : ""}
              onClick={() => setView("week")}
            >
              週
            </button>
          </div>
        </div>

        {view === "month" ? (
          <>
            <div className="weekday-row">
              {WEEKDAYS_JA.map((w) => (
                <div key={w} className="weekday">
                  {w}
                </div>
              ))}
            </div>
            <div className="day-grid">
              {monthDays.map((day) => {
                const inMonth = day.getMonth() === month.getMonth();
                const dayEvents = eventsOf(day);
                const classes = [
                  "day-cell",
                  inMonth ? "" : "outside",
                  isSameDay(day, selected) ? "selected" : "",
                  isSameDay(day, today) ? "today" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={day.toISOString()}
                    className={classes}
                    onClick={() => pickDay(day)}
                  >
                    <span className="day-num">{day.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="day-dot">{dayEvents.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="week-grid">
            {weekDays.map((day) => {
              const dayEvents = eventsOf(day);
              const classes = [
                "week-col",
                isSameDay(day, selected) ? "selected" : "",
                isSameDay(day, today) ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={day.toISOString()}
                  className={classes}
                  onClick={() => setSelected(new Date(day))}
                >
                  <div className="week-col-head">
                    {WEEKDAYS_JA[day.getDay()]} {day.getDate()}
                  </div>
                  <div className="week-col-body">
                    {dayEvents.length === 0 ? (
                      <span className="muted small">—</span>
                    ) : (
                      dayEvents.map((ev) => (
                        <div key={ev.id} className="week-chip">
                          <span className="week-chip-time">
                            {ev.allDay ? "終日" : formatTime(ev.start)}
                          </span>
                          {ev.summary}
                        </div>
                      ))
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {loading && <div className="muted small">読み込み中…</div>}
      </div>

      <div className="day-detail card">
        <div className="card-title">
          {selected.getFullYear()}/{selected.getMonth() + 1}/
          {selected.getDate()} ({WEEKDAYS_JA[selected.getDay()]})
        </div>

        {error && <div className="error small">{error}</div>}

        <ul className="events-list">
          {selectedEvents.length === 0 && (
            <li className="muted small">予定はありません</li>
          )}
          {selectedEvents.map((ev) => (
            <li key={ev.id} className="event-row">
              <div className="event-time">
                {ev.allDay ? "終日" : formatTime(ev.start)}
              </div>
              <div className="event-main">
                <div className="event-title">{ev.summary}</div>
                <JoinButtons event={ev} />
              </div>
              <button
                className="icon-btn"
                aria-label="編集"
                onClick={() => startEdit(ev)}
              >
                ✎
              </button>
              <button
                className="icon-btn"
                aria-label="削除"
                onClick={() => handleDelete(ev.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="add-form">
          <div className="add-form-title">
            {editingId ? "✎ 予定を編集" : "＋ 予定を追加"}
          </div>
          <input
            className="text-input"
            placeholder="タイトル"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="time-row">
            <input
              className="text-input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <span>〜</span>
            <input
              className="text-input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          {!editingId && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={addMeet}
                onChange={(e) => setAddMeet(e.target.checked)}
              />
              <span>Google Meet リンクを発行する</span>
            </label>
          )}
          <div className="form-actions">
            <button className="btn" disabled={saving} onClick={handleSubmit}>
              {saving ? "保存中…" : editingId ? "更新" : "追加"}
            </button>
            {editingId && (
              <button className="btn ghost" disabled={saving} onClick={resetForm}>
                キャンセル
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
