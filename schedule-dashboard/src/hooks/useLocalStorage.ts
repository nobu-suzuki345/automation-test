import { useEffect, useState } from "react";
import { load, save } from "../lib/storage";

/** localStorage と同期する useState。値が変わるたび自動保存する。 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => load(key, initial));

  useEffect(() => {
    save(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
