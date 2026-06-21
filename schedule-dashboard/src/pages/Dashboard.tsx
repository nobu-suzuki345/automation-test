import { useMemo, useState } from "react";
import { CARD_DEFS } from "../cards/registry";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Layout {
  order: string[];
  hidden: string[];
}

export default function Dashboard() {
  const [layout, setLayout] = useLocalStorage<Layout>("dashboard-layout", {
    order: CARD_DEFS.map((c) => c.id),
    hidden: [],
  });
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // 保存済みの順序を尊重しつつ、未知/新規カードは末尾に補完する
  const orderedIds = useMemo(() => {
    const known = CARD_DEFS.map((c) => c.id);
    const saved = layout.order.filter((id) => known.includes(id));
    const missing = known.filter((id) => !saved.includes(id));
    return [...saved, ...missing];
  }, [layout.order]);

  const visibleCards = orderedIds
    .filter((id) => !layout.hidden.includes(id))
    .map((id) => CARD_DEFS.find((c) => c.id === id))
    .filter((c): c is (typeof CARD_DEFS)[number] => Boolean(c));

  const toggleHidden = (id: string) =>
    setLayout((l) =>
      l.hidden.includes(id)
        ? { ...l, hidden: l.hidden.filter((h) => h !== id) }
        : { ...l, hidden: [...l.hidden, id] }
    );

  const move = (id: string, dir: -1 | 1) => {
    const ids = [...orderedIds];
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setLayout((l) => ({ ...l, order: ids }));
  };

  // ドラッグした dragId を targetId の位置へ移動する
  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = [...orderedIds];
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setLayout((l) => ({ ...l, order: ids }));
  };

  return (
    <>
      <div className="page-toolbar">
        <button
          className="btn ghost small"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "完了" : "⚙ カスタマイズ"}
        </button>
      </div>

      {editing && (
        <div className="card customize-panel">
          <div className="card-title">表示するカード・並び順</div>
          <ul className="customize-list">
            {orderedIds.map((id, idx) => {
              const def = CARD_DEFS.find((c) => c.id === id);
              if (!def) return null;
              const hidden = layout.hidden.includes(id);
              return (
                <li
                  key={id}
                  className="customize-row"
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    reorder(id);
                    setDragId(null);
                  }}
                >
                  <label>
                    <span className="drag-handle" aria-hidden>
                      ⠿
                    </span>
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => toggleHidden(id)}
                    />
                    <span className={hidden ? "muted" : ""}>{def.label}</span>
                  </label>
                  <div className="reorder">
                    <button
                      className="icon-btn"
                      aria-label="上へ"
                      disabled={idx === 0}
                      onClick={() => move(id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="下へ"
                      disabled={idx === orderedIds.length - 1}
                      onClick={() => move(id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid">
        {visibleCards.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </div>
    </>
  );
}
