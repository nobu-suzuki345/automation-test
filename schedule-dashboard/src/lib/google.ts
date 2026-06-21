// Google カレンダー連携（フロント完結）。
// - Google Identity Services (GIS) でブラウザ内 OAuth を行いアクセストークンを取得
// - gapi.client + Calendar API v3 で予定の取得 / 作成 / 削除
// アクセストークンは localStorage に保持し、有効期限内なら再同意なしで再利用する。

import { detectMeet, detectZoom } from "./conferencing";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

// 読み書き両方を行うため calendar.events スコープを要求する。
const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const TOKEN_KEY = "gcal_token";

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
  meetLink?: string;
  zoomLink?: string;
  htmlLink?: string;
  colorId?: string;
  calendarId?: string;
  calendarColor?: string;
}

export interface CalendarInfo {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary: boolean;
  accessRole?: string;
}

interface StoredToken {
  access_token: string;
  expires_at: number;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`スクリプトの読み込みに失敗しました: ${src}`));
    document.head.appendChild(s);
  });
}

export async function initGoogle(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID が未設定です。.env.local に OAuth クライアントID を設定してください。"
    );
  }

  await Promise.all([
    loadScript("https://apis.google.com/js/api.js"),
    loadScript("https://accounts.google.com/gsi/client"),
  ]);

  await new Promise<void>((resolve, reject) => {
    gapi.load("client", async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY || undefined,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {},
  });
  gisInited = true;
}

export function isReady(): boolean {
  return gapiInited && gisInited;
}

function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw) as StoredToken;
    // 期限の 1 分前までを有効とみなす
    if (token.expires_at > Date.now() + 60_000) return token;
  } catch {
    // 破損データは無視
  }
  return null;
}

export function isSignedIn(): boolean {
  return getStoredToken() !== null;
}

/** 保存済みトークンを gapi に復元する。成功すれば true。 */
export function restoreSession(): boolean {
  const token = getStoredToken();
  if (token) {
    gapi.client.setToken({ access_token: token.access_token });
    return true;
  }
  return false;
}

export function signIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google が初期化されていません。"));
      return;
    }
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      const expires_at = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
      const token: StoredToken = { access_token: resp.access_token, expires_at };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
      gapi.client.setToken({ access_token: resp.access_token });
      resolve();
    };
    // 既にトークンがあれば同意画面を省略（サイレント更新）
    tokenClient.requestAccessToken({ prompt: getStoredToken() ? "" : "consent" });
  });
}

export function signOut(): void {
  const token = getStoredToken();
  if (token) {
    try {
      google.accounts.oauth2.revoke(token.access_token, () => {});
    } catch {
      // 失効に失敗してもローカルは消す
    }
  }
  localStorage.removeItem(TOKEN_KEY);
  if (gapiInited) gapi.client.setToken(null);
}

function extractMeetFromConference(item: any): string | null {
  const entry = item.conferenceData?.entryPoints?.find(
    (e: any) => e.entryPointType === "video" && typeof e.uri === "string"
  );
  return entry?.uri ?? null;
}

function mapEvent(
  item: any,
  calendarId?: string,
  calendarColor?: string
): CalendarEvent {
  const allDay = Boolean(item.start?.date);
  const start = new Date(item.start?.dateTime ?? item.start?.date);
  const end = new Date(item.end?.dateTime ?? item.end?.date);
  const haystack = [item.summary, item.description, item.location]
    .filter(Boolean)
    .join("\n");

  const meetLink =
    item.hangoutLink ?? extractMeetFromConference(item) ?? detectMeet(haystack);
  const zoomLink = detectZoom(haystack);

  return {
    id: item.id,
    summary: item.summary ?? "(タイトルなし)",
    start,
    end,
    allDay,
    location: item.location,
    description: item.description,
    meetLink: meetLink ?? undefined,
    zoomLink: zoomLink ?? undefined,
    htmlLink: item.htmlLink,
    colorId: item.colorId,
    calendarId,
    calendarColor,
  };
}

export async function listCalendars(): Promise<CalendarInfo[]> {
  const resp = await gapi.client.calendar.calendarList.list();
  const items: any[] = resp.result.items ?? [];
  return items.map((c) => ({
    id: c.id,
    summary: c.summaryOverride || c.summary,
    backgroundColor: c.backgroundColor,
    primary: Boolean(c.primary),
    accessRole: c.accessRole,
  }));
}

export async function listEvents(
  timeMin: Date,
  timeMax: Date,
  calendarId = "primary",
  calendarColor?: string
): Promise<CalendarEvent[]> {
  const resp = await gapi.client.calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });
  const items: any[] = resp.result.items ?? [];
  return items.map((i) => mapEvent(i, calendarId, calendarColor));
}

/** 複数カレンダーの予定をまとめて取得し、開始時刻順に統合する。 */
export async function listEventsForCalendars(
  timeMin: Date,
  timeMax: Date,
  calendars: CalendarInfo[]
): Promise<CalendarEvent[]> {
  if (calendars.length === 0) return [];
  const results = await Promise.all(
    calendars.map((c) =>
      listEvents(timeMin, timeMax, c.id, c.backgroundColor).catch(() => [])
    )
  );
  return results.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface CreateEventInput {
  summary: string;
  start: Date;
  end: Date;
  description?: string;
  addMeet?: boolean;
  colorId?: string;
  calendarId?: string;
}

export async function createEvent(
  input: CreateEventInput
): Promise<CalendarEvent> {
  const calendarId = input.calendarId || "primary";
  const resource: any = {
    summary: input.summary,
    description: input.description || undefined,
    colorId: input.colorId || undefined,
    start: { dateTime: input.start.toISOString() },
    end: { dateTime: input.end.toISOString() },
  };
  if (input.addMeet) {
    resource.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  const resp = await gapi.client.calendar.events.insert({
    calendarId,
    conferenceDataVersion: input.addMeet ? 1 : 0,
    resource,
  });
  return mapEvent(resp.result, calendarId);
}

export interface UpdateEventInput {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
  colorId?: string;
  calendarId?: string;
}

export async function updateEvent(
  input: UpdateEventInput
): Promise<CalendarEvent> {
  const calendarId = input.calendarId || "primary";
  const resp = await gapi.client.calendar.events.patch({
    calendarId,
    eventId: input.id,
    resource: {
      summary: input.summary,
      description: input.description || undefined,
      colorId: input.colorId || undefined,
      start: { dateTime: input.start.toISOString() },
      end: { dateTime: input.end.toISOString() },
    },
  });
  return mapEvent(resp.result, calendarId);
}

export async function deleteEvent(
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await gapi.client.calendar.events.delete({
    calendarId,
    eventId,
  });
}
