import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { listTodayEvents, type CalendarEvent } from "../lib/google";
import { useGoogle } from "./GoogleContext";

interface EventsState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EventsCtx = createContext<EventsState | null>(null);

/** ダッシュボードで共有する「今日の予定」。複数カードから同じデータを参照する。 */
export function EventsProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useGoogle();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!signedIn) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    listTodayEvents()
      .then((evts) => setEvents(evts))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "予定の取得に失敗しました")
      )
      .finally(() => setLoading(false));
  }, [signedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <EventsCtx.Provider value={{ events, loading, error, refresh }}>
      {children}
    </EventsCtx.Provider>
  );
}

export function useEvents(): EventsState {
  const ctx = useContext(EventsCtx);
  if (!ctx) throw new Error("useEvents は EventsProvider 内で使ってください。");
  return ctx;
}
