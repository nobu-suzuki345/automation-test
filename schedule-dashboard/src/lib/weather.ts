// 天気取得（Open-Meteo）。APIキー不要・CORS 対応。
// - 現在地はブラウザの Geolocation、または都市名のジオコーディングで座標を得る
// - 取得した座標から現在の天気と当日の最高/最低気温を取得する

export interface Weather {
  temp: number;
  code: number;
  windSpeed: number;
  max: number;
  min: number;
}

export interface GeoPlace {
  lat: number;
  lon: number;
  name: string;
}

// WMO weather code -> 表示ラベルとアイコン
const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "快晴", icon: "☀️" },
  1: { label: "晴れ", icon: "🌤️" },
  2: { label: "薄曇り", icon: "⛅" },
  3: { label: "曇り", icon: "☁️" },
  45: { label: "霧", icon: "🌫️" },
  48: { label: "霧氷", icon: "🌫️" },
  51: { label: "霧雨（弱）", icon: "🌦️" },
  53: { label: "霧雨", icon: "🌦️" },
  55: { label: "霧雨（強）", icon: "🌦️" },
  61: { label: "雨（弱）", icon: "🌧️" },
  63: { label: "雨", icon: "🌧️" },
  65: { label: "雨（強）", icon: "🌧️" },
  71: { label: "雪（弱）", icon: "🌨️" },
  73: { label: "雪", icon: "🌨️" },
  75: { label: "雪（強）", icon: "❄️" },
  80: { label: "にわか雨", icon: "🌦️" },
  81: { label: "にわか雨", icon: "🌧️" },
  82: { label: "激しいにわか雨", icon: "⛈️" },
  95: { label: "雷雨", icon: "⛈️" },
  96: { label: "雷雨（雹）", icon: "⛈️" },
  99: { label: "雷雨（雹）", icon: "⛈️" },
};

export function weatherInfo(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: "—", icon: "🌡️" };
}

export async function geocode(name: string): Promise<GeoPlace | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&count=1&language=ja&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("地名の検索に失敗しました");
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return { lat: r.latitude, lon: r.longitude, name: r.name };
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("天気の取得に失敗しました");
  const d = await res.json();
  return {
    temp: d.current.temperature_2m,
    code: d.current.weather_code,
    windSpeed: d.current.wind_speed_10m,
    max: d.daily.temperature_2m_max[0],
    min: d.daily.temperature_2m_min[0],
  };
}

export function getBrowserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("このブラウザは位置情報に未対応です"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "位置情報を取得できませんでした")),
      { timeout: 10000 }
    );
  });
}
