import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useGoogle } from "../context/GoogleContext";
import { createEvent } from "../lib/google";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  due?: string; // YYYY-MM-DD
  category?: string;
}

const ALL = "__all__";

export default function TodoCard() {
  const { signedIn } = useGoogle();
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [input, setInput] = useState("");
  const [due, setDue] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState<string>(ALL);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos([
      {
        id: crypto.randomUUID(),
        text,
        done: false,
        due: due || undefined,
        category: category.trim() || undefined,
      },
      ...todos,
    ]);
    setInput("");
    setDue("");
    setCategory("");
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  const addToCalendar = async (todo: Todo) => {
    if (!todo.due) return;
    const start = new Date(`${todo.due}T09:00:00`);
    const end = new Date(`${todo.due}T09:30:00`);
    try {
      await createEvent({ summary: todo.text, start, end });
      setAddedId(todo.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      // ログインしていない等は無視
    }
  };

  // dragId を targetId の前に移動する
  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = todos.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...todos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setTodos(next);
  };

  const categories = Array.from(
    new Set(todos.map((t) => t.category).filter((c): c is string => Boolean(c)))
  );
  const visible =
    filter === ALL ? todos : todos.filter((t) => t.category === filter);
  const remaining = todos.filter((t) => !t.done).length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="card todo-card">
      <div className="card-title">
        ✅ TODO <span className="badge">{remaining}</span>
      </div>

      <div className="todo-add">
        <input
          className="text-input"
          value={input}
          placeholder="やることを追加"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn small" onClick={add}>
          追加
        </button>
      </div>
      <div className="todo-add">
        <input
          className="text-input"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          title="期限（任意）"
        />
        <input
          className="text-input"
          value={category}
          placeholder="カテゴリ（任意）"
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="todo-filters">
          <button
            className={filter === ALL ? "chip active" : "chip"}
            onClick={() => setFilter(ALL)}
          >
            すべて
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={filter === c ? "chip active" : "chip"}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className="todo-list">
        {visible.length === 0 && <li className="muted small">タスクはありません</li>}
        {visible.map((t) => {
          const overdue = t.due && !t.done && t.due < today;
          return (
            <li
              key={t.id}
              className={t.done ? "todo-item done" : "todo-item"}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                reorder(t.id);
                setDragId(null);
              }}
            >
              <label>
                <span className="drag-handle" aria-hidden>
                  ⠿
                </span>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle(t.id)}
                />
                <span className="todo-text">
                  {t.text}
                  {t.category && <span className="todo-cat">{t.category}</span>}
                  {t.due && (
                    <span className={overdue ? "todo-due overdue" : "todo-due"}>
                      {t.due.slice(5)}
                    </span>
                  )}
                </span>
              </label>
              <div className="todo-actions">
                {signedIn && t.due && (
                  <button
                    className="icon-btn"
                    aria-label="カレンダーに追加"
                    title="カレンダーに追加"
                    onClick={() => addToCalendar(t)}
                  >
                    {addedId === t.id ? "✓" : "📅"}
                  </button>
                )}
                <button
                  className="icon-btn"
                  aria-label="削除"
                  onClick={() => remove(t.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
