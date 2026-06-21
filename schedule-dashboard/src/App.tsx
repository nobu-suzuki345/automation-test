import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import { useGoogle } from "./context/GoogleContext";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { ready, signedIn, signIn, signOut, error } = useGoogle();
  const { theme, toggle } = useTheme();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📋 マイダッシュボード</div>
        <nav className="nav">
          <NavLink to="/" end>
            ダッシュボード
          </NavLink>
          <NavLink to="/schedule">スケジュール帳</NavLink>
        </nav>
        <div className="auth">
          <button
            className="icon-btn"
            aria-label="テーマ切替"
            title="テーマ切替"
            onClick={toggle}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {!ready ? (
            <span className="muted small">読み込み中…</span>
          ) : signedIn ? (
            <button className="btn ghost small" onClick={signOut}>
              ログアウト
            </button>
          ) : (
            <button className="btn small" onClick={signIn}>
              Googleでログイン
            </button>
          )}
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </main>
    </div>
  );
}
