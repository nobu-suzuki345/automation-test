import { useCallback, useEffect, useState } from "react";
import { useGoogle } from "../context/GoogleContext";
import { listEvents, type CalendarEvent } from "../lib/google";
import { formatTime, WEEKDAYS_JA } from "../lib/datetime";
import JoinButtons from "../components/JoinButtons";

const RANGE_DAYS = 7;
const MAX_ITEMS = 6;

export default function UpcomingCard() {
  const { ready, signedIn, signIn } = useGoogle();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!signedIn) {
      setEvents([]);
      return;
    }
    const now = new Date();
    const max = new Date();
    max.setDate(max.getDate() + RANGE_DAYS);
    max.setHours(23, 59, 59, 999);

    setLoading(true);
    setError(null);
    listEvents(now, max)
      .then((evts) =>
        setEvents(
          evts.filter((e) => e.start.getTime() > now.getTime()).slice(0, MAX_ITEMS)
        )
      )
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "取得に失敗しました")
      )
      .finally(() => setLoading(false));
  }, [signedIn]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="card upcoming-card">
      <div className="card-title">
        🗓️ 今後の予定
        {signedIn && (
          <button className="icon-btn" aria-label="再読み込み" onClick={load}>
            ⟳
          </button>
        )}
      </div>

      {!signedIn ? (
        <div className="card-empty">
          <p className="muted small">
            ログインすると今後{RANGE_DAYS}日間の予定を表示します。
          </p>
          <button className="btn small" disabled={!ready} onClick={signIn}>
            Googleでログイン
          </button>
        </div>
      ) : loading ? (
        <p className="muted small">読み込み中…</p>
      ) : error ? (
        <p className="error small">{error}</p>
      ) : events.length === 0 ? (
        <p className="muted small">この先{RANGE_DAYS}日間の予定はありません</p>
      ) : (
        <ul className="events-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-row">
              <div className="up-when">
                <div className="up-date">
                  {ev.start.getMonth() + 1}/{ev.start.getDate()}（
                  {WEEKDAYS_JA[ev.start.getDay()]}）
                </div>
                <div className="event-time">
                  {ev.allDay ? "終日" : formatTime(ev.start)}
                </div>
              </div>
              <div className="event-main">
                <div className="event-title">{ev.summary}</div>
                <JoinButtons event={ev} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
