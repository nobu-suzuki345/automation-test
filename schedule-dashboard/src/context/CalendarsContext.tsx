import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listCalendars, type CalendarInfo } from "../lib/google";
import { load, save } from "../lib/storage";
import { useGoogle } from "./GoogleContext";

const SELECTED_KEY = "selected-calendars";

interface CalendarsState {
  calendars: CalendarInfo[];
  selectedIds: string[];
  selectedCalendars: CalendarInfo[];
  writableCalendars: CalendarInfo[];
  loading: boolean;
  toggle: (id: string) => void;
}

const CalendarsCtx = createContext<CalendarsState | null>(null);

export function CalendarsProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useGoogle();
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    load<string[] | null>(SELECTED_KEY, null) ?? []
  );
  const [hasSaved, setHasSaved] = useState<boolean>(
    () => load<string[] | null>(SELECTED_KEY, null) !== null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setCalendars([]);
      return;
    }
    setLoading(true);
    listCalendars()
      .then((cals) => {
        setCalendars(cals);
        // 初回（保存なし）は全カレンダーを選択状態にする
        if (!hasSaved) {
          setSelectedIds(cals.map((c) => c.id));
        }
      })
      .catch(() => setCalendars([]))
      .finally(() => setLoading(false));
  }, [signedIn, hasSaved]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      save(SELECTED_KEY, next);
      return next;
    });
    setHasSaved(true);
  }, []);

  // 存在するカレンダーだけに絞る
  const selectedCalendars = useMemo(
    () => calendars.filter((c) => selectedIds.includes(c.id)),
    [calendars, selectedIds]
  );

  const writableCalendars = useMemo(
    () =>
      calendars.filter(
        (c) => c.accessRole === "owner" || c.accessRole === "writer"
      ),
    [calendars]
  );

  return (
    <CalendarsCtx.Provider
      value={{
        calendars,
        selectedIds,
        selectedCalendars,
        writableCalendars,
        loading,
        toggle,
      }}
    >
      {children}
    </CalendarsCtx.Provider>
  );
}

export function useCalendars(): CalendarsState {
  const ctx = useContext(CalendarsCtx);
  if (!ctx)
    throw new Error("useCalendars は CalendarsProvider 内で使ってください。");
  return ctx;
}
