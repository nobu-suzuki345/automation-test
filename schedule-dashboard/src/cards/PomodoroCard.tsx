import { useEffect, useState } from "react";

const WORK = 25 * 60;
const BREAK = 5 * 60;

export default function PomodoroCard() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [left, setLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);

  // 1 秒ごとのカウントダウン
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // 0 になったらモードを切り替えて継続
  useEffect(() => {
    if (left > 0) return;
    if (mode === "work") {
      setCount((c) => c + 1);
      setMode("break");
      setLeft(BREAK);
    } else {
      setMode("work");
      setLeft(WORK);
    }
  }, [left, mode]);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setLeft(WORK);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <section className="card pomodoro-card">
      <div className="card-title">
        🍅 ポモドーロ <span className="badge">{count}</span>
      </div>
      <div className={mode === "work" ? "pomo-mode work" : "pomo-mode break"}>
        {mode === "work" ? "作業中" : "休憩中"}
      </div>
      <div className="pomo-time">
        {mm}:{ss}
      </div>
      <div className="pomo-controls">
        <button className="btn small" onClick={() => setRunning((r) => !r)}>
          {running ? "一時停止" : "開始"}
        </button>
        <button className="btn ghost small" onClick={reset}>
          リセット
        </button>
      </div>
    </section>
  );
}
