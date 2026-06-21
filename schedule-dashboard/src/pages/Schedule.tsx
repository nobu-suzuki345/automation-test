import { useCallback, useEffect, useMemo, useState } from "react";
import { useGoogle } from "../context/GoogleContext";
import {
  createEvent,
  deleteEvent,
  listEvents,
  type CalendarEvent,
} from "../lib/google";
import { formatTime, isSameDay, WEEKDAYS_JA } from "../lib/datetime";
import JoinButtons from "../components/JoinButtons";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** 月表示用に 6 週 × 7 日 = 42 セルの日付配列を作る。 */
function buildCalendarDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export default function Schedule() {
  const { ready, signedIn, signIn } = useGoogle();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 追加フォーム
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [addMeet, setAddMeet] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => buildCalendarDays(month), [month]);

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
    (day: Date) => events.filter((e) => isSameDay(e.start, day)),
    [events]
  );

  const selectedEvents = eventsOf(selected).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const handleAdd = async () => {
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
      await createEvent({ summary: summary.trim(), start, end, addMeet });
      setSummary("");
      setAddMeet(false);
      loadMonth();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "予定の作成に失敗しました");
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

  return (
    <div className="schedule">
      <div className="calendar card">
        <div className="calendar-head">
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))}>
            ‹
          </button>
          <div className="calendar-title">
            {month.getFullYear()}年 {month.getMonth() + 1}月
          </div>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))}>
            ›
          </button>
        </div>

        <div className="weekday-row">
          {WEEKDAYS_JA.map((w) => (
            <div key={w} className="weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="day-grid">
          {days.map((day) => {
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
                onClick={() => setSelected(new Date(day))}
              >
                <span className="day-num">{day.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="day-dot">{dayEvents.length}</span>
                )}
              </button>
            );
          })}
        </div>
        {loading && <div className="muted small">読み込み中…</div>}
      </div>

      <div className="day-detail card">
        <div className="card-title">
          {month.getFullYear()}/{selected.getMonth() + 1}/{selected.getDate()} (
          {WEEKDAYS_JA[selected.getDay()]})
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
                aria-label="削除"
                onClick={() => handleDelete(ev.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="add-form">
          <div className="add-form-title">＋ 予定を追加</div>
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
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={addMeet}
              onChange={(e) => setAddMeet(e.target.checked)}
            />
            <span>Google Meet リンクを発行する</span>
          </label>
          <button className="btn" disabled={saving} onClick={handleAdd}>
            {saving ? "保存中…" : "追加"}
          </button>
        </div>
      </div>
    </div>
  );
}
