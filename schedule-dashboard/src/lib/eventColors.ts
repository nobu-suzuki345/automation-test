// Google カレンダーの colorId と表示色（HEX）の対応。
// 未設定（colorId なし）の予定はカレンダー既定色として扱う。

export interface EventColor {
  id: string;
  name: string;
  hex: string;
}

export const EVENT_COLORS: EventColor[] = [
  { id: "1", name: "ラベンダー", hex: "#7986cb" },
  { id: "2", name: "セージ", hex: "#33b679" },
  { id: "3", name: "ブドウ", hex: "#8e24aa" },
  { id: "4", name: "フラミンゴ", hex: "#e67c73" },
  { id: "5", name: "バナナ", hex: "#f6bf26" },
  { id: "6", name: "ミカン", hex: "#f4511e" },
  { id: "7", name: "ピーコック", hex: "#039be5" },
  { id: "8", name: "グラファイト", hex: "#616161" },
  { id: "9", name: "ブルーベリー", hex: "#3f51b5" },
  { id: "10", name: "バジル", hex: "#0b8043" },
  { id: "11", name: "トマト", hex: "#d50000" },
];

const DEFAULT_HEX = "#2f6fed";

export function colorHex(colorId?: string): string {
  if (!colorId) return DEFAULT_HEX;
  return EVENT_COLORS.find((c) => c.id === colorId)?.hex ?? DEFAULT_HEX;
}
