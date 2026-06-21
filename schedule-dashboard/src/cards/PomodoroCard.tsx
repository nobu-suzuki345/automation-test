import { useEffect, useRef, useState } from "react";

const WORK = 25 * 60;
const BREAK = 5 * 60;

/** 短いビープ音を鳴らす（WebAudio）。失敗しても無視する。 */
function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch {
    // 無音で続行
  }
}

function notify(title: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title);
  }
}

export default function PomodoroCard() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [left, setLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [canNotify, setCanNotify] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const switching = useRef(false);

  // 1 秒ごとのカウントダウン
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // 0 になったらモードを切り替えて継続（通知＋ビープ）
  useEffect(() => {
    if (left > 0 || switching.current) return;
    switching.current = true;
    beep();
    if (mode === "work") {
      setCount((c) => c + 1);
      notify("作業終了！休憩しましょう ☕");
      setMode("break");
      setLeft(BREAK);
    } else {
      notify("休憩終了！作業を再開しましょう 💪");
      setMode("work");
      setLeft(WORK);
    }
    // 次の tick で解除
    setTimeout(() => {
      switching.current = false;
    }, 0);
  }, [left, mode]);

  const requestNotify = async () => {
    if (typeof Notification === "undefined") return;
    const res = await Notification.requestPermission();
    setCanNotify(res === "granted");
  };

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
        {!canNotify && (
          <button
            className="icon-btn"
            aria-label="通知を許可"
            title="通知を許可"
            onClick={requestNotify}
          >
            🔔
          </button>
        )}
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
