// カレンダー予定のテキストから Web 会議 URL を検出するユーティリティ。
// Google Meet は API 上のフィールドでも取得できるが、本文に書かれている
// ケースもあるためフォールバックとして正規表現でも拾う。
// Zoom は外部サービスのため、本文/場所に貼られた URL を検出して
// 「参加」ボタン化する（会議の新規作成は対象外）。

const MEET_RE = /https?:\/\/meet\.google\.com\/[a-z0-9-]+/i;
const ZOOM_RE = /https?:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/(?:j|my|w|wc\/join)\/[^\s"'<>)]+/i;

export function detectMeet(text: string): string | null {
  const m = text.match(MEET_RE);
  return m ? m[0] : null;
}

export function detectZoom(text: string): string | null {
  const m = text.match(ZOOM_RE);
  return m ? m[0] : null;
}
