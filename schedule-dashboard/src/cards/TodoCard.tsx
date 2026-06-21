import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export default function TodoCard() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [input, setInput] = useState("");

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos([{ id: crypto.randomUUID(), text, done: false }, ...todos]);
    setInput("");
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  const remaining = todos.filter((t) => !t.done).length;

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

      <ul className="todo-list">
        {todos.length === 0 && <li className="muted small">タスクはありません</li>}
        {todos.map((t) => (
          <li key={t.id} className={t.done ? "todo-item done" : "todo-item"}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
              />
              <span>{t.text}</span>
            </label>
            <button
              className="icon-btn"
              aria-label="削除"
              onClick={() => remove(t.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
