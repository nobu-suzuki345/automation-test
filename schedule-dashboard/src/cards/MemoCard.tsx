import { useLocalStorage } from "../hooks/useLocalStorage";

export default function MemoCard() {
  const [memo, setMemo] = useLocalStorage<string>("memo", "");

  return (
    <section className="card memo-card">
      <div className="card-title">📝 メモ</div>
      <textarea
        className="memo-input"
        value={memo}
        placeholder="クイックノート（自動保存）"
        onChange={(e) => setMemo(e.target.value)}
      />
      <div className="muted small">入力すると自動保存されます</div>
    </section>
  );
}
