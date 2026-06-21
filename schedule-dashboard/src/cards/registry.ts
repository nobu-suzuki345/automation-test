import type { ComponentType } from "react";
import ClockCard from "./ClockCard";
import WeatherCard from "./WeatherCard";
import CountdownCard from "./CountdownCard";
import TodayEventsCard from "./TodayEventsCard";
import UpcomingCard from "./UpcomingCard";
import TodoCard from "./TodoCard";
import PomodoroCard from "./PomodoroCard";
import MemoCard from "./MemoCard";

export interface CardDef {
  id: string;
  label: string;
  Component: ComponentType;
}

// ダッシュボードに並べるカードの定義。表示順・表示/非表示は
// この順序を初期値として localStorage に保存する。
export const CARD_DEFS: CardDef[] = [
  { id: "clock", label: "🕐 時計", Component: ClockCard },
  { id: "weather", label: "🌦️ 天気", Component: WeatherCard },
  { id: "countdown", label: "⏳ カウントダウン", Component: CountdownCard },
  { id: "events", label: "📅 今日の予定", Component: TodayEventsCard },
  { id: "upcoming", label: "🗓️ 今後の予定", Component: UpcomingCard },
  { id: "todo", label: "✅ TODO", Component: TodoCard },
  { id: "pomodoro", label: "🍅 ポモドーロ", Component: PomodoroCard },
  { id: "memo", label: "📝 メモ", Component: MemoCard },
];
