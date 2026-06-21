import type { CalendarEvent } from "../lib/google";

/** 予定に Meet / Zoom リンクがあれば参加ボタンを表示する。 */
export default function JoinButtons({ event }: { event: CalendarEvent }) {
  if (!event.meetLink && !event.zoomLink) return null;
  return (
    <div className="join-buttons">
      {event.meetLink && (
        <a
          className="join meet"
          href={event.meetLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          📹 Meet
        </a>
      )}
      {event.zoomLink && (
        <a
          className="join zoom"
          href={event.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          🔵 Zoom
        </a>
      )}
    </div>
  );
}
