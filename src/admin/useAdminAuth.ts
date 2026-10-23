import { useCallback, useEffect, useState } from "react";
import {
  checkAdminMembership,
  getSession,
  getValidSession,
  signOut,
  subscribeToAuth,
  type AdminSession,
} from "../data/auth";

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(() => getSession());
  const [checkingSession, setCheckingSession] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    void getValidSession()
      .then((valid) => {
        if (!active) return;
        setSession(valid);
        setCheckingSession(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setCheckingSession(false);
      });

    const unsubscribe = subscribeToAuth((next) => {
      if (active) setSession(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    let active = true;
    setCheckingAdmin(true);

    void checkAdminMembership()
      .then((allowed) => {
        if (!active) return;
        setIsAdmin(allowed);
        setCheckingAdmin(false);
      })
      .catch(() => {
        if (!active) return;
        setIsAdmin(false);
        setCheckingAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  return {
    session,
    checking: checkingSession || checkingAdmin,
    isAdmin,
    signOut: handleSignOut,
  };
}
