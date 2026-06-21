import type { ComponentType } from "react";
import ClockCard from "./ClockCard";
import CountdownCard from "./CountdownCard";
import TodayEventsCard from "./TodayEventsCard";
import TodoCard from "./TodoCard";
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
  { id: "countdown", label: "⏳ カウントダウン", Component: CountdownCard },
  { id: "events", label: "📅 今日の予定", Component: TodayEventsCard },
  { id: "todo", label: "✅ TODO", Component: TodoCard },
  { id: "memo", label: "📝 メモ", Component: MemoCard },
];
