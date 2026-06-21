import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { WEEKDAYS_JA } from "../lib/datetime";
import {
  fetchWeather,
  geocode,
  getBrowserLocation,
  weatherInfo,
  type Weather,
} from "../lib/weather";

interface Loc {
  lat: number;
  lon: number;
  name: string;
}

export default function WeatherCard() {
  const [loc, setLoc] = useLocalStorage<Loc | null>("weather-loc", null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");

  const load = useCallback((l: Loc) => {
    setLoading(true);
    setError(null);
    fetchWeather(l.lat, l.lon)
      .then(setWeather)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "取得に失敗しました")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loc) load(loc);
  }, [loc, load]);

  const useCurrent = async () => {
    setError(null);
    setLoading(true);
    try {
      const p = await getBrowserLocation();
      setLoc({ lat: p.lat, lon: p.lon, name: "現在地" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "位置情報を取得できませんでした");
      setLoading(false);
    }
  };

  const useCity = async () => {
    if (!city.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const g = await geocode(city.trim());
      if (!g) {
        setError("地名が見つかりませんでした");
        setLoading(false);
        return;
      }
      setLoc({ lat: g.lat, lon: g.lon, name: g.name });
      setCity("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "検索に失敗しました");
      setLoading(false);
    }
  };

  const info = weather ? weatherInfo(weather.code) : null;

  return (
    <section className="card weather-card">
      <div className="card-title">
        🌦️ 天気
        {loc && (
          <button
            className="icon-btn"
            aria-label="場所を変更"
            onClick={() => setLoc(null)}
          >
            ⚙
          </button>
        )}
      </div>

      {!loc ? (
        <div className="weather-setup">
          <button className="btn small" onClick={useCurrent}>
            📍 現在地を使う
          </button>
          <div className="weather-city">
            <input
              className="text-input"
              placeholder="都市名で検索（例: 焼津）"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && useCity()}
            />
            <button className="btn small" onClick={useCity}>
              検索
            </button>
          </div>
          {loading && <div className="muted small">取得中…</div>}
          {error && <div className="error small">{error}</div>}
        </div>
      ) : loading ? (
        <p className="muted small">取得中…</p>
      ) : error ? (
        <p className="error small">{error}</p>
      ) : weather && info ? (
        <>
          <div className="weather-main">
            <div className="weather-icon">{info.icon}</div>
            <div className="weather-temp">{Math.round(weather.temp)}°</div>
            <div className="weather-meta">
              <div>{info.label}</div>
              <div className="muted small">
                {loc.name}・最高 {Math.round(weather.max)}° / 最低{" "}
                {Math.round(weather.min)}°
              </div>
            </div>
          </div>
          <div className="weather-week">
            {weather.daily.slice(0, 7).map((d) => (
              <div key={d.date.toISOString()} className="weather-day">
                <div className="weather-day-name">
                  {WEEKDAYS_JA[d.date.getDay()]}
                </div>
                <div className="weather-day-icon">{weatherInfo(d.code).icon}</div>
                <div className="weather-day-temp">
                  <span>{Math.round(d.max)}°</span>
                  <span className="muted">{Math.round(d.min)}°</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
