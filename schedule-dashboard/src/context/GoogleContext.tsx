import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  initGoogle,
  isSignedIn,
  restoreSession,
  signIn as gSignIn,
  signOut as gSignOut,
} from "../lib/google";

interface GoogleState {
  ready: boolean;
  signedIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const GoogleCtx = createContext<GoogleState | null>(null);

export function GoogleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initGoogle()
      .then(() => {
        if (cancelled) return;
        if (isSignedIn()) {
          restoreSession();
          setSignedIn(true);
        }
        setReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    try {
      await gSignIn();
      setSignedIn(true);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "サインインに失敗しました");
    }
  }, []);

  const signOut = useCallback(() => {
    gSignOut();
    setSignedIn(false);
  }, []);

  return (
    <GoogleCtx.Provider value={{ ready, signedIn, error, signIn, signOut }}>
      {children}
    </GoogleCtx.Provider>
  );
}

export function useGoogle(): GoogleState {
  const ctx = useContext(GoogleCtx);
  if (!ctx) throw new Error("useGoogle は GoogleProvider 内で使ってください。");
  return ctx;
}
