import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useGoogle } from "../context/GoogleContext";
import { createEvent } from "../lib/google";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  due?: string; // YYYY-MM-DD
}

export default function TodoCard() {
  const { signedIn } = useGoogle();
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [input, setInput] = useState("");
  const [due, setDue] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos([
      { id: crypto.randomUUID(), text, done: false, due: due || undefined },
      ...todos,
    ]);
    setInput("");
    setDue("");
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  // TODO を期限日の予定（09:00-09:30）として Google カレンダーに登録する
  const addToCalendar = async (todo: Todo) => {
    if (!todo.due) return;
    const start = new Date(`${todo.due}T09:00:00`);
    const end = new Date(`${todo.due}T09:30:00`);
    try {
      await createEvent({ summary: todo.text, start, end });
      setAddedId(todo.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      // 失敗時は何もしない（ログインしていない等）
    }
  };

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
      <input
        className="text-input todo-due-input"
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        title="期限（任意）"
      />

      <ul className="todo-list">
        {todos.length === 0 && <li className="muted small">タスクはありません</li>}
        {todos.map((t) => {
          const overdue = t.due && !t.done && t.due < today;
          return (
            <li key={t.id} className={t.done ? "todo-item done" : "todo-item"}>
              <label>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle(t.id)}
                />
                <span className="todo-text">
                  {t.text}
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
