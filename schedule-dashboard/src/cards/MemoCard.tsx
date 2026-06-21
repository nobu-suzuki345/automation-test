import { useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { load } from "../lib/storage";

interface Note {
  id: string;
  title: string;
  body: string;
}

// 旧バージョンの単一メモ（"memo" キー）があれば 1 ノートとして引き継ぐ。
function initialNotes(): Note[] {
  const oldMemo = load<string>("memo", "");
  return [
    { id: crypto.randomUUID(), title: "メモ", body: oldMemo },
  ];
}

export default function MemoCard() {
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", initialNotes());
  const [selectedId, setSelectedId] = useState<string>(() => notes[0]?.id ?? "");

  const selected = notes.find((n) => n.id === selectedId) ?? notes[0];

  useEffect(() => {
    if (!notes.find((n) => n.id === selectedId) && notes[0]) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  const addNote = () => {
    const n: Note = { id: crypto.randomUUID(), title: "新規ノート", body: "" };
    setNotes([...notes, n]);
    setSelectedId(n.id);
  };

  const updateSelected = (patch: Partial<Note>) => {
    if (!selected) return;
    setNotes(notes.map((n) => (n.id === selected.id ? { ...n, ...patch } : n)));
  };

  const deleteNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(
      next.length
        ? next
        : [{ id: crypto.randomUUID(), title: "メモ", body: "" }]
    );
  };

  if (!selected) return null;

  return (
    <section className="card memo-card">
      <div className="card-title">
        📝 メモ
        <button
          className="icon-btn"
          aria-label="ノートを追加"
          title="ノートを追加"
          onClick={addNote}
        >
          ＋
        </button>
      </div>

      <div className="memo-tabs">
        {notes.map((n) => (
          <button
            key={n.id}
            className={n.id === selected.id ? "chip active" : "chip"}
            onClick={() => setSelectedId(n.id)}
          >
            {n.title || "無題"}
          </button>
        ))}
      </div>

      <input
        className="text-input memo-title"
        value={selected.title}
        placeholder="ノート名"
        onChange={(e) => updateSelected({ title: e.target.value })}
      />
      <textarea
        className="memo-input"
        value={selected.body}
        placeholder="クイックノート（自動保存）"
        onChange={(e) => updateSelected({ body: e.target.value })}
      />
      <div className="memo-foot">
        <span className="muted small">自動保存されます</span>
        {notes.length > 1 && (
          <button
            className="btn ghost small"
            onClick={() => deleteNote(selected.id)}
          >
            このノートを削除
          </button>
        )}
      </div>
    </section>
  );
}
