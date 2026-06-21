import { useEffect, useState } from "react";
import { formatDateJa } from "../lib/datetime";

export default function ClockCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <section className="card clock-card">
      <div className="card-title">🕐 時計</div>
      <div className="clock-time">{time}</div>
      <div className="clock-date">{formatDateJa(now)}</div>
    </section>
  );
}
