import { useCallback, useEffect, useState } from 'react';

const KEY = 'trustledger.admin.session';

// session: undefined = still reading storage, null = signed out, object = { token, user }
export function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  }, []);

  const save = useCallback((next) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the session still works until the tab reloads.
    }
    setSession(next);
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
    setSession(null);
  }, []);

  return { session, save, clear };
}
