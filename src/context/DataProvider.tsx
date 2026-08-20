'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { InterviewDay, Rating, Student, User } from '@/lib/data';
import { DEMO_PERSONAS } from '@/lib/data';
import {
  clearLegacyAuthStorage,
  getInterviewRepository,
  type SyncStatus
} from '@/lib/data-access';
import { AppError, type AppErrorCode } from '@/lib/errors';
import { getSupabaseConfigDiagnostics, type AppMode } from '@/lib/mode';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface DataContextType {
  appMode: AppMode;
  configSummary: string;
  isDemoSession: boolean;
  syncStatus: SyncStatus;
  lastError: { code: AppErrorCode; message: string } | null;
  clearError: () => void;
  currentUser: User | null;
  users: User[];
  students: Student[];
  ratings: Rating[];
  demoPersonas: User[];
  /** Connected mode: Supabase Auth email/password. */
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  /** Offline-demo mode only: enter a synthetic persona (no password). */
  enterDemoPersona: (personaId: string) => Promise<boolean>;
  /** @deprecated Prefer loginWithPassword / enterDemoPersona */
  login: (identifier: string, pass: string, nameHint?: string, rememberMe?: boolean) => boolean;
  logout: () => Promise<void>;
  addStudent: (student: Student) => void;
  updateRating: (rating: Rating) => void;
  submitRating: (studentId: string, panelistId: string) => void;
  setRatingSubmitted: (studentId: string, panelistId: string, value: boolean) => void;
  setStudentStatus: (studentId: string, status: Student['status']) => Promise<boolean>;
  listPanels: () => Promise<Array<{ id: number; name: string }>>;
  createPanelist: (input: {
    phone: string;
    password?: string;
    displayName: string;
    displayTitle?: string;
    role?: User['role'];
    panelIds: number[];
  }) => Promise<boolean>;
  updateUser: (
    userId: string,
    updates: {
      displayName?: string;
      displayTitle?: string;
      role?: User['role'];
      isActive?: boolean;
      phone?: string;
    }
  ) => Promise<boolean>;
  updatePanelMemberships: (userId: string, panelIds: number[]) => Promise<boolean>;
  createCandidate: (input: {
    regNo: string;
    name: string;
    day: InterviewDay;
    panelId: number;
    timing: string;
    status: Student['status'];
    form?: Student['form'];
  }) => Promise<boolean>;
  updateCandidate: (
    candidateId: string,
    updates: {
      regNo?: string;
      name?: string;
      day?: InterviewDay;
      panelId?: number;
      timing?: string;
      status?: Student['status'];
      isActive?: boolean;
      form?: Student['form'];
    }
  ) => Promise<boolean>;
  getStudentRatings: (studentId: string) => Rating[];
  getOverallScore: (studentId: string) => number;
  refreshFromServer: () => Promise<void>;
  /** Super Admin only: UI switch into the panelist interview dashboard. Does not change DB role. */
  viewAsPanelist: boolean;
  setViewAsPanelist: (value: boolean) => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => useContext(DataContext);

const VIEW_AS_PANELIST_KEY = 'idash.viewAsPanelist';

function persistViewAsPanelist(value: boolean) {
  try {
    if (value) sessionStorage.setItem(VIEW_AS_PANELIST_KEY, '1');
    else sessionStorage.removeItem(VIEW_AS_PANELIST_KEY);
  } catch {
    // Ignore quota / private-mode failures; in-memory state still works.
  }
}

function normalizeRating(rating: Rating): Rating {
  const scores: Record<string, number> = {};
  Object.entries(rating.scores || {}).forEach(([key, value]) => {
    if (typeof value === 'number') scores[key] = value;
  });

  const domainPriorities = Array.isArray(rating.domainPriorities)
    ? rating.domainPriorities.filter(Boolean).slice(0, 3)
    : [];

  return {
    ...rating,
    scores,
    domainPriorities,
    bestDomain: rating.bestDomain || domainPriorities[0] || ''
  };
}

function ratingKey(rating: Pick<Rating, 'studentId' | 'panelistId'>) {
  return `${rating.studentId}::${rating.panelistId}`;
}

function upsertLocalRating(list: Rating[], rating: Rating): Rating[] {
  const idx = list.findIndex(
    (row) => row.studentId === rating.studentId && row.panelistId === rating.panelistId
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = rating;
    return next;
  }
  return [...list, rating];
}

function mergeRatingsPreservingPending(incoming: Rating[], previous: Rating[], pendingKeys: Set<string>): Rating[] {
  const merged = incoming.map((row) => {
    const key = ratingKey(row);
    if (!pendingKeys.has(key)) return row;
    return previous.find((item) => ratingKey(item) === key) || row;
  });
  previous.forEach((local) => {
    const key = ratingKey(local);
    if (pendingKeys.has(key) && !merged.some((row) => ratingKey(row) === key)) {
      merged.push(local);
    }
  });
  return merged;
}

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const repository = useMemo(() => getInterviewRepository(), []);
  const config = useMemo(() => getSupabaseConfigDiagnostics(), []);
  const appMode = repository.mode;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(appMode === 'offline-demo');
  const [users, setUsers] = useState<User[]>(appMode === 'offline-demo' ? DEMO_PERSONAS : []);
  const [students, setStudents] = useState<Student[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastError, setLastError] = useState<{ code: AppErrorCode; message: string } | null>(null);
  const [panels, setPanels] = useState<Array<{ id: number; name: string }>>([]);
  const [viewAsPanelist, setViewAsPanelistState] = useState(false);
  const pendingByKeyRef = useRef(new Map<string, Rating>());
  const inFlightKeysRef = useRef(new Set<string>());
  const sessionEpochRef = useRef(0);

  useEffect(() => {
    try {
      setViewAsPanelistState(sessionStorage.getItem(VIEW_AS_PANELIST_KEY) === '1');
    } catch {
      setViewAsPanelistState(false);
    }
  }, []);

  const setViewAsPanelist = useCallback((value: boolean) => {
    setViewAsPanelistState(value);
    persistViewAsPanelist(value);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  const reportError = useCallback((error: AppError) => {
    setLastError({ code: error.code, message: error.userMessage });
    setSyncStatus(
      error.code === 'OFFLINE'
        ? 'offline'
        : error.code === 'AUTHORIZATION_FAILURE' || error.code === 'AUTHENTICATION_FAILURE'
          ? 'unauthorized'
          : 'error'
    );
  }, []);

  const loadWorkspace = useCallback(
    async (viewer: User) => {
      const [profilesResult, candidatesResult, ratingsResult] = await Promise.all([
        repository.listVisibleProfiles(viewer),
        repository.listCandidates(viewer),
        repository.listRatings(viewer)
      ]);
      const panelsResult = await repository.listPanels(viewer);

      if (!profilesResult.ok) {
        reportError(profilesResult.error);
      } else {
        setUsers(profilesResult.data);
      }

      if (!candidatesResult.ok) {
        reportError(candidatesResult.error);
      } else {
        setStudents(candidatesResult.data);
      }

      if (!ratingsResult.ok) {
        reportError(ratingsResult.error);
      } else {
        setRatings((prev) =>
          mergeRatingsPreservingPending(
            ratingsResult.data.map(normalizeRating),
            prev,
            new Set([...pendingByKeyRef.current.keys(), ...inFlightKeysRef.current])
          )
        );
      }
      if (panelsResult.ok) setPanels(panelsResult.data);
      if (candidatesResult.ok) {
        setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
        if (profilesResult.ok && ratingsResult.ok) setLastError(null);
      }
    },
    [appMode, reportError, repository]
  );

  const refreshFromServer = useCallback(async () => {
    const epoch = sessionEpochRef.current;
    setSyncStatus('loading');
    const sessionResult = await repository.getSession();
    if (epoch !== sessionEpochRef.current) return;

    if (!sessionResult.ok) {
      setCurrentUser(null);
      setStudents([]);
      setRatings([]);
      setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
      return;
    }

    setIsDemoSession(sessionResult.data.isDemoSession);
    setCurrentUser(sessionResult.data.user);

    if (!sessionResult.data.user) {
      setStudents([]);
      setRatings([]);
      setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
      return;
    }

    await loadWorkspace(sessionResult.data.user);
  }, [appMode, loadWorkspace, repository]);

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    clearLegacyAuthStorage();
    void refreshFromServer();
  }, [refreshFromServer]);

  // Realtime subscriptions in connected mode (best-effort; errors surface via syncStatus).
  useEffect(() => {
    if (appMode !== 'connected' || !currentUser) return;

    const sb = createBrowserSupabaseClient();
    if (!sb) return;

    const reloadLists = () => {
      const viewer = currentUserRef.current;
      if (!viewer) return;
      void loadWorkspace(viewer);
    };

    const channel = sb
      .channel(`dashboard-live-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, () => {
        const viewer = currentUserRef.current;
        if (!viewer) return;
        void repository.listRatings(viewer).then((result) => {
          if (!result.ok) {
            reportError(result.error);
            return;
          }
          setRatings((prev) =>
            mergeRatingsPreservingPending(
              result.data.map(normalizeRating),
              prev,
              new Set([...pendingByKeyRef.current.keys(), ...inFlightKeysRef.current])
            )
          );
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, reloadLists)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, reloadLists)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        const viewer = currentUserRef.current;
        if (!viewer) return;
        void repository.listVisibleProfiles(viewer).then((result) => {
          if (!result.ok) {
            reportError(result.error);
            return;
          }
          setUsers(result.data);
          const me = result.data.find((user) => user.id === viewer.id);
          if (me) {
            setCurrentUser((prev) => (prev && prev.id === me.id ? { ...prev, ...me, panelIds: me.panelIds || prev.panelIds } : prev));
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panel_memberships' }, reloadLists)
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [appMode, currentUser?.id, loadWorkspace, reportError, repository]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      sessionEpochRef.current += 1;
      const epoch = sessionEpochRef.current;
      clearError();
      const result = await repository.signInWithPassword(email, password);
      if (epoch !== sessionEpochRef.current) return false;
      if (!result.ok) {
        reportError(result.error);
        setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
        return false;
      }
      setIsDemoSession(false);
      setCurrentUser(result.data);
      setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
      void loadWorkspace(result.data);
      return true;
    },
    [appMode, clearError, loadWorkspace, reportError, repository]
  );

  const enterDemoPersona = useCallback(
    async (personaId: string) => {
      clearError();
      setSyncStatus('loading');
      const result = await repository.enterDemoPersona(personaId);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      setIsDemoSession(true);
      setCurrentUser(result.data);
      await loadWorkspace(result.data);
      return true;
    },
    [clearError, loadWorkspace, reportError, repository]
  );

  /**
   * Backward-compatible sync wrapper used by older call sites.
   * In connected mode this always fails closed (use loginWithPassword).
   * In offline-demo mode, non-empty password attempts are rejected — use persona entry.
   */
  const login = useCallback(
    (_identifier: string, _pass: string, _nameHint?: string, _rememberMe?: boolean) => {
      void _identifier;
      void _pass;
      void _nameHint;
      void _rememberMe;
      setLastError({
        code: 'AUTHENTICATION_FAILURE',
        message:
          appMode === 'offline-demo'
            ? 'Use a demo persona to continue. Password login is disabled in offline-demo mode.'
            : 'Use your phone number and password to sign in.'
      });
      return false;
    },
    [appMode]
  );

  const logout = useCallback(async () => {
    sessionEpochRef.current += 1;
    setCurrentUser(null);
    setStudents([]);
    setRatings([]);
    setViewAsPanelist(false);
    setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
    try {
      await Promise.race([
        repository.signOut(),
        new Promise<void>((resolve) => {
          setTimeout(resolve, 400);
        })
      ]);
    } catch {
      // Local navigation to /logout still expires cookies.
    }
  }, [appMode, repository, setViewAsPanelist]);

  const addStudent = useCallback((student: Student) => {
    void student;
    setLastError({
      code: 'AUTHORIZATION_FAILURE',
      message: 'Adding candidates from the client is disabled. Use an admin-managed seed/migration.'
    });
  }, []);

  const persistRating = useCallback(
    async (rating: Rating) => {
      if (!currentUser) {
        reportError(new AppError('AUTHENTICATION_FAILURE', 'Not signed in'));
        return;
      }

      const normalized = normalizeRating({ ...rating, panelistId: currentUser.id });
      const key = ratingKey(normalized);
      pendingByKeyRef.current.set(key, normalized);
      setRatings((prev) => upsertLocalRating(prev, normalized));

      if (inFlightKeysRef.current.has(key)) return;
      inFlightKeysRef.current.add(key);

      let failed = false;
      try {
        while (pendingByKeyRef.current.has(key)) {
          const payload = pendingByKeyRef.current.get(key);
          if (!payload) break;
          pendingByKeyRef.current.delete(key);
          const result = await repository.upsertRating(currentUser, payload);
          if (!result.ok) {
            pendingByKeyRef.current.set(key, payload);
            reportError(result.error);
            failed = true;
            break;
          }
          const confirmed = normalizeRating(result.data);
          if (!pendingByKeyRef.current.has(key)) {
            setRatings((prev) => upsertLocalRating(prev, confirmed));
          }
          setSyncStatus(appMode === 'offline-demo' ? 'offline' : 'ready');
          setLastError(null);
        }
      } finally {
        inFlightKeysRef.current.delete(key);
        const queued = pendingByKeyRef.current.get(key);
        if (!failed && queued) void persistRating(queued);
      }
    },
    [appMode, currentUser, reportError, repository]
  );

  const updateRating = useCallback(
    (updatedRating: Rating) => {
      void persistRating(updatedRating);
    },
    [persistRating]
  );

  const submitRating = useCallback(
    (studentId: string, panelistId: string) => {
      if (!currentUser) return;
      const existing = ratings.find((r) => r.studentId === studentId && r.panelistId === panelistId);
      const next = normalizeRating({
        studentId,
        panelistId: currentUser.id,
        scores: existing?.scores || {},
        comment: existing?.comment || '',
        bestDomain: existing?.bestDomain || '',
        domainPriorities: existing?.domainPriorities || [],
        active: existing?.active || false,
        submitted: true
      });
      void persistRating(next);
    },
    [currentUser, persistRating, ratings]
  );

  const setRatingSubmitted = useCallback(
    (studentId: string, panelistId: string, value: boolean) => {
      if (!currentUser) return;
      const existing = ratings.find((r) => r.studentId === studentId && r.panelistId === panelistId);
      if (!existing && !value) return;
      const next = normalizeRating({
        studentId,
        panelistId: currentUser.id,
        scores: existing?.scores || {},
        comment: existing?.comment || '',
        bestDomain: existing?.bestDomain || '',
        domainPriorities: existing?.domainPriorities || [],
        active: existing?.active || false,
        submitted: value
      });
      void persistRating(next);
    },
    [currentUser, persistRating, ratings]
  );

  const setStudentStatus = useCallback(
    async (studentId: string, status: Student['status']) => {
      if (!currentUser) {
        setLastError({
          code: 'AUTHENTICATION_FAILURE',
          message: 'Not signed in.'
        });
        return false;
      }
      const result = await repository.setCandidateStatus(currentUser, studentId, status);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      setStudents((prev) => prev.map((s) => (s.id === studentId ? result.data : s)));
      return true;
    },
    [currentUser, reportError, repository]
  );

  const listPanels = useCallback(async () => {
    if (!currentUser) return panels;
    const result = await repository.listPanels(currentUser);
    if (!result.ok) {
      reportError(result.error);
      return panels;
    }
    setPanels(result.data);
    return result.data;
  }, [currentUser, panels, reportError, repository]);

  const createPanelist = useCallback(
    async (input: {
      phone: string;
      password?: string;
      displayName: string;
      displayTitle?: string;
      role?: User['role'];
      panelIds: number[];
    }) => {
      if (!currentUser) return false;
      const result = await repository.createPanelist(currentUser, input);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      await loadWorkspace(currentUser);
      return true;
    },
    [currentUser, loadWorkspace, reportError, repository]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      updates: {
        displayName?: string;
        displayTitle?: string;
        role?: User['role'];
        isActive?: boolean;
        phone?: string;
      }
    ) => {
      if (!currentUser) return false;
      const result = await repository.updateUser(currentUser, userId, updates);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                name: updates.displayName ?? user.name,
                displayTitle: updates.displayTitle ?? user.displayTitle,
                role: updates.role ?? user.role,
                isActive: updates.isActive ?? user.isActive,
                phone: updates.phone ?? user.phone
              }
            : user
        )
      );
      await loadWorkspace(currentUser);
      return true;
    },
    [currentUser, loadWorkspace, reportError, repository]
  );

  const updatePanelMemberships = useCallback(
    async (userId: string, panelIds: number[]) => {
      if (!currentUser) return false;
      const result = await repository.updatePanelMemberships(currentUser, userId, panelIds);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      await loadWorkspace(currentUser);
      return true;
    },
    [currentUser, loadWorkspace, reportError, repository]
  );

  const createCandidate = useCallback(
    async (input: {
      regNo: string;
      name: string;
      day: InterviewDay;
      panelId: number;
      timing: string;
      status: Student['status'];
      form?: Student['form'];
    }) => {
      if (!currentUser) return false;
      const result = await repository.createCandidate(currentUser, input);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      await loadWorkspace(currentUser);
      return true;
    },
    [currentUser, loadWorkspace, reportError, repository]
  );

  const updateCandidate = useCallback(
    async (
      candidateId: string,
      updates: {
        regNo?: string;
        name?: string;
        day?: InterviewDay;
        panelId?: number;
        timing?: string;
        status?: Student['status'];
        isActive?: boolean;
        form?: Student['form'];
      }
    ) => {
      if (!currentUser) return false;
      const result = await repository.updateCandidate(currentUser, candidateId, updates);
      if (!result.ok) {
        reportError(result.error);
        return false;
      }
      setStudents((prev) =>
        prev.map((student) =>
          student.id === candidateId
            ? {
                ...student,
                name: updates.name ?? student.name,
                regNo: updates.regNo ?? student.regNo,
                day: updates.day ?? student.day,
                panelId: updates.panelId ?? student.panelId,
                timing: updates.timing ?? student.timing,
                status: updates.status ?? student.status,
                isActive: updates.isActive ?? student.isActive,
                form: updates.form ? { ...student.form, ...updates.form } : student.form
              }
            : student
        )
      );
      await loadWorkspace(currentUser);
      return true;
    },
    [currentUser, loadWorkspace, reportError, repository]
  );

  const getStudentRatings = useCallback(
    (studentId: string) => ratings.filter((r) => r.studentId === studentId),
    [ratings]
  );

  const getOverallScore = useCallback(
    (studentId: string) => {
      const studentRatings = getStudentRatings(studentId);
      if (studentRatings.length === 0) return 0;

      let totalScore = 0;
      let count = 0;

      studentRatings.forEach((r) => {
        const interviewScore = r.scores['Interview Score'];
        if (typeof interviewScore === 'number') {
          totalScore += interviewScore;
          count++;
          return;
        }
        const values = Object.values(r.scores).filter((value): value is number => typeof value === 'number');
        if (values.length > 0) {
          totalScore += values.reduce((a, b) => a + b, 0) / values.length;
          count++;
        }
      });

      return count === 0 ? 0 : totalScore / count;
    },
    [getStudentRatings]
  );

  const value: DataContextType = {
    appMode,
    configSummary: config.summary,
    isDemoSession,
    syncStatus,
    lastError,
    clearError,
    currentUser,
    users,
    students,
    ratings,
    demoPersonas: DEMO_PERSONAS,
    loginWithPassword,
    enterDemoPersona,
    login,
    logout,
    addStudent,
    updateRating,
    submitRating,
    setRatingSubmitted,
    setStudentStatus,
    listPanels,
    createPanelist,
    updateUser,
    updatePanelMemberships,
    createCandidate,
    updateCandidate,
    getStudentRatings,
    getOverallScore,
    refreshFromServer,
    viewAsPanelist,
    setViewAsPanelist
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
