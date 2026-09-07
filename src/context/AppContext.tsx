'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppEvent,
  BirthdayAlert,
  Child,
  ChildFormData,
  ConfessionAlert,
  DashboardStats,
  PriestUser,
  Stage,
  ActionType,
} from '@/types';
import {
  getApiErrorMessage,
  ACTION_TYPE_TO_API,
  addConfession,
  addOperation,
  createChild,
  deleteChild,
  fetchChild,
  fetchChildren,
  fetchDashboard,
  fetchStages,
  loginWithCredentials,
  logoutUser,
  markConfessionReminderRead,
  markEventRead,
  restoreSession,
  snoozeConfessionReminder,
  updateChild,
} from '@/lib/api';
import { mapApiStage } from '@/lib/api/children';

interface AppContextValue {
  user: PriestUser | null;
  isLoggedIn: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  stages: Stage[];
  childList: Child[];
  dashboardStats: DashboardStats;
  confessionAlerts: ConfessionAlert[];
  birthdayAlerts: BirthdayAlert[];
  events: AppEvent[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshDashboard: () => Promise<void>;
  loadChildren: () => Promise<Child[]>;
  loadChild: (id: string) => Promise<Child | null>;
  saveChild: (data: ChildFormData & { id?: string }) => Promise<string>;
  removeChild: (id: string) => Promise<void>;
  recordConfession: (childId: string, confessionAt: string, notes?: string) => Promise<void>;
  recordOperation: (
    childId: string,
    type: string,
    operationDate: string,
    note?: string
  ) => Promise<void>;
  markConfessionNoted: (childId: string) => Promise<void>;
  snoozeConfession: (childId: string, until: string) => Promise<void>;
  takeConfessionAction: (
    childId: string,
    actionType: string,
    actionDate: string,
    actionNote?: string
  ) => Promise<void>;
  takeBirthdayAction: (
    childId: string,
    actionType: string,
    actionDate: string,
    actionNote?: string
  ) => Promise<void>;
  markBirthdayNoted: (childId: string) => Promise<void>;
  markEventAsRead: (eventId: string) => Promise<void>;
  getChild: (id: string) => Child | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

const defaultStats: DashboardStats = {
  childrenCount: 0,
  childrenNeedingConfessionCount: 0,
  birthdaysThisWeekCount: 0,
  generalEventsThisWeekCount: 0,
};

export function AppProvider({ children: reactChildren }: { children: ReactNode }) {
  const [user, setUser] = useState<PriestUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [childList, setChildList] = useState<Child[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [confessionAlerts, setConfessionAlerts] = useState<ConfessionAlert[]>([]);
  const [birthdayAlerts, setBirthdayAlerts] = useState<BirthdayAlert[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [childDetails, setChildDetails] = useState<Record<string, Child>>({});

  const isLoggedIn = !!user;

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    setError(getApiErrorMessage(err));
  }, []);

  const applyDashboard = useCallback((dashboard: Awaited<ReturnType<typeof fetchDashboard>>) => {
    setDashboardStats(dashboard.stats);
    setConfessionAlerts(dashboard.confessionAlerts);
    setBirthdayAlerts(dashboard.birthdayAlerts);
    setEvents(dashboard.events);
  }, []);

  const refreshDashboard = useCallback(async () => {
    const dashboard = await fetchDashboard(childList);
    applyDashboard(dashboard);
  }, [childList, applyDashboard]);

  const loadChildren = useCallback(async () => {
    const children = await fetchChildren();
    setChildList(children);
    return children;
  }, []);

  const loadStages = useCallback(async () => {
    const apiStages = await fetchStages();
    setStages(apiStages.map(mapApiStage));
  }, []);

  const hydrateSession = useCallback(async (sessionUser: PriestUser) => {
    setUser(sessionUser);
    const [, children] = await Promise.all([loadStages(), loadChildren()]);
    const dashboard = await fetchDashboard(children);
    applyDashboard(dashboard);
  }, [loadStages, loadChildren, applyDashboard]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const sessionUser = await restoreSession();
        if (cancelled) return;
        if (sessionUser) {
          await hydrateSession(sessionUser);
        }
      } catch (err) {
        if (!cancelled) handleError(err);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [hydrateSession, handleError]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionUser = await loginWithCredentials(email, password);
      await hydrateSession(sessionUser);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hydrateSession, handleError]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setChildList([]);
    setChildDetails({});
    setStages([]);
    setDashboardStats(null);
    setConfessionAlerts([]);
    setBirthdayAlerts([]);
    setEvents([]);
    setError(null);
  }, []);

  const loadChild = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const child = await fetchChild(id);
      setChildDetails((prev) => ({ ...prev, [id]: child }));
      setChildList((prev) => {
        const exists = prev.some((c) => c.id === id);
        return exists ? prev.map((c) => (c.id === id ? child : c)) : [...prev, child];
      });
      return child;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const saveChild = useCallback(async (data: ChildFormData & { id?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        birthday: data.birthday || undefined,
        marriageContract: data.marriageContract || undefined,
        phoneNumber: data.phoneNumber || undefined,
        stageId: data.stageId,
      };

      const child = data.id
        ? await updateChild(data.id, payload)
        : await createChild(payload);

      setChildList((prev) => {
        const exists = prev.some((c) => c.id === child.id);
        return exists ? prev.map((c) => (c.id === child.id ? child : c)) : [...prev, child];
      });
      setChildDetails((prev) => ({ ...prev, [child.id]: child }));
      await refreshDashboard();
      return child.id;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, refreshDashboard]);

  const removeChild = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteChild(id);
      setChildList((prev) => prev.filter((c) => c.id !== id));
      setChildDetails((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refreshDashboard();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, refreshDashboard]);

  const recordConfession = useCallback(async (childId: string, confessionAt: string, notes?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await addConfession(childId, confessionAt, notes);
      await loadChild(childId);
      await refreshDashboard();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadChild, refreshDashboard, handleError]);

  const recordOperation = useCallback(async (
    childId: string,
    type: string,
    operationDate: string,
    note?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await addOperation(childId, type, operationDate, note);
      await loadChild(childId);
      await refreshDashboard();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadChild, refreshDashboard, handleError]);

  const markConfessionNoted = useCallback(async (childId: string) => {
    setError(null);
    try {
      await markConfessionReminderRead(childId);
      await refreshDashboard();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [refreshDashboard, handleError]);

  const snoozeConfession = useCallback(async (childId: string, until: string) => {
    setError(null);
    try {
      await snoozeConfessionReminder(childId, until);
      await refreshDashboard();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [refreshDashboard, handleError]);

  const takeConfessionAction = useCallback(async (
    childId: string,
    actionType: string,
    actionDate: string,
    actionNote?: string
  ) => {
    const apiType = ACTION_TYPE_TO_API[actionType] ?? 'follow_up';
    await recordOperation(childId, apiType, actionDate, actionNote);
    await markConfessionReminderRead(childId);
    await refreshDashboard();
  }, [recordOperation, refreshDashboard]);

  const markBirthdayNoted = useCallback(async (childId: string) => {
    await recordOperation(childId, 'birthday', new Date().toISOString().slice(0, 10), 'تم الاطلاع');
    setBirthdayAlerts((prev) =>
      prev.map((a) => (a.childId === childId ? { ...a, status: 'noted' as const } : a))
    );
  }, [recordOperation]);

  const takeBirthdayAction = useCallback(async (
    childId: string,
    actionType: string,
    actionDate: string,
    actionNote?: string
  ) => {
    const apiType = ACTION_TYPE_TO_API[actionType] ?? 'birthday';
    const note = actionNote ? `${actionType}: ${actionNote}` : actionType;
    await recordOperation(childId, apiType === 'birthday' ? 'birthday' : apiType, actionDate, note);
    setBirthdayAlerts((prev) =>
      prev.map((a) =>
        a.childId === childId
          ? { ...a, status: 'action_taken' as const, actionDate, actionNote, actionType: actionType as ActionType }
          : a
      )
    );
  }, [recordOperation]);

  const markEventAsRead = useCallback(async (eventId: string) => {
    setError(null);
    try {
      await markEventRead(eventId);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isRead: true } : e)));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const getChild = useCallback((id: string) => {
    return childDetails[id] ?? childList.find((c) => c.id === id);
  }, [childDetails, childList]);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        isInitializing,
        isLoading,
        error,
        stages,
        childList,
        dashboardStats: dashboardStats ?? defaultStats,
        confessionAlerts,
        birthdayAlerts,
        events,
        login,
        logout,
        clearError,
        refreshDashboard,
        loadChildren,
        loadChild,
        saveChild,
        removeChild,
        recordConfession,
        recordOperation,
        markConfessionNoted,
        snoozeConfession,
        takeConfessionAction,
        takeBirthdayAction,
        markBirthdayNoted,
        markEventAsRead,
        getChild,
      }}
    >
      {reactChildren}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
