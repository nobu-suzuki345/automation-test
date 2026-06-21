import { useEffect, useMemo, useState } from "react";
import { useEvents } from "../context/EventsContext";
import { useGoogle } from "../context/GoogleContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { formatDuration, formatTime } from "../lib/datetime";

interface CustomTarget {
  label: string;
  date: string; // YYYY-MM-DD
}

export default function CountdownCard() {
  const { signedIn } = useGoogle();
  const { events } = useEvents();
  const [now, setNow] = useState(() => Date.now());
  const [target, setTarget] = useLocalStorage<CustomTarget>("countdown", {
    label: "",
    date: "",
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // 次の予定（今より後に始まる最初のイベント）
  const nextEvent = useMemo(
    () =>
      events
        .filter((e) => !e.allDay && e.start.getTime() > now)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null,
    [events, now]
  );

  const customMs = target.date
    ? new Date(`${target.date}T00:00:00`).getTime() - now
    : null;

  return (
    <section className="card countdown-card">
      <div className="card-title">⏳ カウントダウン</div>

      {/* 次の予定まで */}
      <div className="countdown-block">
        <div className="countdown-label">次の予定まで</div>
        {!signedIn ? (
          <div className="muted small">ログインすると表示されます</div>
        ) : nextEvent ? (
          <>
            <div className="countdown-value">
              {formatDuration(nextEvent.start.getTime() - now)}
            </div>
            <div className="muted small">
              {formatTime(nextEvent.start)}「{nextEvent.summary}」
            </div>
          </>
        ) : (
          <div className="muted small">この先の予定はありません</div>
        )}
      </div>

      <hr className="divider" />

      {/* カスタムカウントダウン */}
      <div className="countdown-block">
        <div className="countdown-label">
          {target.label ? `${target.label}まで` : "カスタム"}
        </div>
        {customMs !== null && (
          <div className="countdown-value">{formatDuration(customMs)}</div>
        )}
        <div className="countdown-form">
          <input
            className="text-input"
            placeholder="イベント名"
            value={target.label}
            onChange={(e) => setTarget({ ...target, label: e.target.value })}
          />
          <input
            className="text-input"
            type="date"
            value={target.date}
            onChange={(e) => setTarget({ ...target, date: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
