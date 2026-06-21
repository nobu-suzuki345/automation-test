// localStorage の薄いラッパー。JSON のシリアライズ/パースと
// 例外（プライベートモードなど）の握り潰しをまとめて行う。

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量超過やプライベートモードでは保存を諦める
  }
}
