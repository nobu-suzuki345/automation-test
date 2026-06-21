import { useEvents } from "../context/EventsContext";
import { useGoogle } from "../context/GoogleContext";
import { formatTime } from "../lib/datetime";
import { eventColorOf } from "../lib/eventColors";
import JoinButtons from "../components/JoinButtons";

export default function TodayEventsCard() {
  const { ready, signedIn, signIn } = useGoogle();
  const { events, loading, error, refresh } = useEvents();

  return (
    <section className="card events-card">
      <div className="card-title">
        📅 今日の予定
        {signedIn && (
          <button className="icon-btn" aria-label="再読み込み" onClick={refresh}>
            ⟳
          </button>
        )}
      </div>

      {!signedIn ? (
        <div className="card-empty">
          <p className="muted small">
            Google カレンダーと連携すると今日の予定が表示されます。
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
        <p className="muted small">今日の予定はありません 🎉</p>
      ) : (
        <ul className="events-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-row">
              <span
                className="event-color"
                style={{ background: eventColorOf(ev.colorId, ev.calendarColor) }}
              />
              <div className="event-time">
                {ev.allDay ? "終日" : formatTime(ev.start)}
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
