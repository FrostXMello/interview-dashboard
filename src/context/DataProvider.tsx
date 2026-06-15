'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Student, Rating, INITIAL_USERS, INITIAL_STUDENTS } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import APPLICANTS from '@/lib/applicants';
import type { ApplicantForm } from '@/lib/applicants';

type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
};

type SupabaseRatingRow = {
  studentid?: string;
  panelistid?: string;
  studentId?: string;
  panelistId?: string;
  scores?: Record<string, number | string[]>;
  comment?: string;
  submitted?: boolean;
  active?: boolean;
  bestDomain?: string;
  domainPriorities?: string[];
};

type SupabaseStudentRow = {
  id?: string;
  regno?: string;
  regNo?: string;
  name?: string;
  timing?: string;
  panelid?: number;
  panelId?: number;
  status?: string;
  form?: ApplicantForm;
};

type SupabaseUserRow = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  panelid?: number;
  panelId?: number;
};

interface DataContextType {
  currentUser: User | null;
  users: User[];
  students: Student[];
  ratings: Rating[];
  login: (phone: string, pass: string, nameHint?: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  addStudent: (student: Student) => void;
  updateRating: (rating: Rating) => void;
  submitRating: (studentId: string, panelistId: string) => void;
  setRatingSubmitted: (studentId: string, panelistId: string, value: boolean) => void;
  getStudentRatings: (studentId: string) => Rating[];
  getOverallScore: (studentId: string) => number;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => useContext(DataContext);

const CURRENT_USER_KEY = 'interview_curr_user';
const REMEMBER_ME_KEY = 'interview_remember_me';

const normalizeRating = (rating: Rating): Rating => {
  const scores = { ...(rating.scores || {}) } as Record<string, number | string[]>;

  const priorityFromScores = Array.isArray(scores.__domainPriorities)
    ? (scores.__domainPriorities as string[])
    : [];

  const explicitPriorities = Array.isArray(rating.domainPriorities)
    ? rating.domainPriorities.filter(Boolean)
    : [];

  const domainPriorities = explicitPriorities.length > 0
    ? explicitPriorities
    : priorityFromScores.filter(Boolean);

  const nextScores = { ...scores };
  nextScores.__domainPriorities = domainPriorities;

  return {
    ...rating,
    scores: nextScores,
    domainPriorities,
    bestDomain: rating.bestDomain || domainPriorities[0] || ''
  };
};

const fromSupabaseRatingRow = (row: SupabaseRatingRow): Rating => {
  const studentId = row.studentid || row.studentId || '';
  const panelistId = row.panelistid || row.panelistId || '';

  return normalizeRating({
    studentId,
    panelistId,
    scores: (row.scores || {}) as Record<string, number | string[]>,
    comment: row.comment || '',
    submitted: Boolean(row.submitted),
    active: Boolean(row.active),
    bestDomain: row.bestDomain || '',
    domainPriorities: Array.isArray(row.domainPriorities) ? row.domainPriorities : []
  } as Rating);
};

const toSupabaseRatingPayload = (rating: Rating) => {
  const normalized = normalizeRating(rating);
  const scorePayload = {
    ...(normalized.scores || {}),
    __domainPriorities: normalized.domainPriorities || []
  };

  // Keep payload compatible with existing Supabase ratings schema.
  return {
    studentid: normalized.studentId,
    panelistid: normalized.panelistId,
    scores: scorePayload,
    comment: normalized.comment,
    submitted: normalized.submitted,
    active: normalized.active
  };
};

const normalizeProficiencies = (app: ApplicantForm) => {
  const prof = app.proficiencies || {};

  let communication = prof['Communication'];
  let timeManagement = prof['Time Management'];
  let teamWork = prof['Team Work'];
  const graphicDesign = prof['Graphic Design'];

  // Older imported rows are shifted by one column. Shift to maintain all 4 keys.
  if (!communication && (timeManagement || teamWork || graphicDesign)) {
    communication = timeManagement;
    timeManagement = teamWork;
    teamWork = graphicDesign;
  }

  return {
    Communication: communication || '—',
    'Time Management': timeManagement || '—',
    'Team Work': teamWork || '—',
    'Graphic Design': graphicDesign || '—'
  };
};

const normalizeLookup = (value?: string) => (value || '').trim().toLowerCase();

const buildFormFromApplicant = (app: ApplicantForm): ApplicantForm => ({
  timestamp: app.timestamp,
  fullName: app.fullName,
  regNo: app.regNo,
  email: app.email,
  phone: app.phone,
  program: app.program,
  whyInterested: app.whyInterested,
  domains: app.domains,
  proficiencies: normalizeProficiencies(app),
  commitment: app.commitment,
  experience: app.experience,
  cvLink: app.cvLink
});

const APPLICANT_BY_REG = new Map(
  APPLICANTS
    .filter((app) => app.regNo)
    .map((app) => [normalizeLookup(app.regNo), app] as const)
);

const APPLICANT_BY_NAME = new Map(
  APPLICANTS
    .filter((app) => app.fullName)
    .map((app) => [normalizeLookup(app.fullName), app] as const)
);

const enrichStudentWithApplicant = (student: Student): Student => {
  const fullNameKey = normalizeLookup(student.name);
  const firstNameKey = normalizeLookup(student.name.split(' ')[0]);

  const match = APPLICANT_BY_REG.get(normalizeLookup(student.regNo))
    || APPLICANT_BY_NAME.get(fullNameKey)
    || APPLICANT_BY_NAME.get(firstNameKey)
    || APPLICANTS.find((app) => {
      const appName = normalizeLookup(app.fullName);
      return Boolean(appName) && (appName.startsWith(`${firstNameKey} `) || fullNameKey.startsWith(`${appName} `));
    });

  if (!match) return student;

  const mergedForm = {
    ...buildFormFromApplicant(match),
    ...(student.form || {})
  };

  return {
    ...student,
    form: mergedForm
  };
};

const fromSupabaseStudentRow = (row: SupabaseStudentRow): Student => {
  const panelCandidate = row.panelid ?? row.panelId ?? 0;
  const panelId = Number.isFinite(Number(panelCandidate)) ? Number(panelCandidate) : 0;
  const status = row.status === 'pending' || row.status === 'interviewing' || row.status === 'completed'
    ? row.status
    : 'pending';

  const student: Student = {
    id: row.id || `tbd-${normalizeLookup(row.regno || row.regNo || row.name || 'unknown')}`,
    regNo: (row.regno || row.regNo || '').trim(),
    name: (row.name || '').trim(),
    timing: (row.timing || 'TBD').trim(),
    panelId,
    status,
    form: row.form
  };

  return enrichStudentWithApplicant(student);
};

const toSupabaseStudentPayload = (student: Student): SupabaseStudentRow => {
  const enriched = enrichStudentWithApplicant(student);
  return {
    id: enriched.id,
    regno: enriched.regNo,
    name: enriched.name,
    timing: enriched.timing,
    panelid: enriched.panelId,
    status: enriched.status,
    form: enriched.form
  };
};

const mergeStudentsById = (base: Student[], incoming: Student[]): Student[] => {
  const merged = new Map<string, Student>();

  base.forEach((student) => {
    merged.set(student.id, student);
  });

  incoming.forEach((student) => {
    merged.set(student.id, student);
  });

  return Array.from(merged.values());
};

const fromSupabaseUserRow = (row: SupabaseUserRow): User | null => {
  const phone = (row.phone || '').trim();
  const password = (row.password || '').trim();
  const name = (row.name || '').trim();

  if (!phone || !password || !name) return null;

  const panelCandidate = row.panelid ?? row.panelId;
  const parsedPanel = Number(panelCandidate);

  return {
    id: (row.id || `sb-${phone}`).trim(),
    name,
    email: row.email,
    phone,
    password,
    role: (row.role || 'panelist').trim(),
    panelId: Number.isFinite(parsedPanel) ? parsedPanel : undefined
  };
};

const toSupabaseUserPayload = (user: User): SupabaseUserRow => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  password: user.password,
  role: user.role,
  panelid: user.panelId
});

const mergeUsersByPhone = (primary: User[], fallback: User[]): User[] => {
  const merged = new Map<string, User>();

  fallback.forEach((user) => {
    merged.set(user.phone.trim(), user);
  });

  primary.forEach((user) => {
    merged.set(user.phone.trim(), user);
  });

  return Array.from(merged.values());
};

const normalizePhoneForLogin = (value: string) => value.replace(/\D/g, '');

const buildLoginUsers = (primary: User[], fallback: User[]): User[] => {
  const seen = new Set<string>();
  const combined = [...primary, ...fallback];

  return combined.filter((user) => {
    const key = `${normalizePhoneForLogin(user.phone)}|${user.password.trim()}|${user.name.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS.map(enrichStudentWithApplicant));
  const [ratings, setRatings] = useState<Rating[]>([]);

  // Restore local session state immediately so refresh/offline does not lose in-progress edits.
  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_ME_KEY);
    const persistedUser = localStorage.getItem(CURRENT_USER_KEY);
    const sessionUser = sessionStorage.getItem(CURRENT_USER_KEY);

    if (persistedUser) {
      setCurrentUser(JSON.parse(persistedUser));
      setRememberMe(savedRemember !== '0');
    } else if (sessionUser) {
      setCurrentUser(JSON.parse(sessionUser));
      setRememberMe(false);
    }

    const savedStudents = localStorage.getItem('interview_students');
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents) as Student[];
        setStudents(parsed.map(enrichStudentWithApplicant));
      } catch {}
    }

    const savedRatings = localStorage.getItem('interview_ratings');
    if (savedRatings) {
      try {
        const parsed = JSON.parse(savedRatings) as Rating[];
        setRatings(parsed.map(normalizeRating));
      } catch {}
    }
  }, []);

  // On reconnect, sync local snapshot to backend so offline edits are persisted.
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;

    const syncOnReconnect = () => {
      const studentPayload = students.map(toSupabaseStudentPayload);
      const ratingPayload = ratings.map(toSupabaseRatingPayload);

      if (studentPayload.length > 0) {
        sb
          .from('students')
          .upsert(studentPayload, { onConflict: 'id' })
          .then(() => {}, (err: unknown) => console.warn('Supabase reconnect students sync failed', err));
      }

      if (ratingPayload.length > 0) {
        sb
          .from('ratings')
          .upsert(ratingPayload, { onConflict: 'studentid,panelistid' })
          .then(() => {}, (err: unknown) => console.warn('Supabase reconnect ratings sync failed', err));
      }
    };

    window.addEventListener('online', syncOnReconnect);
    return () => window.removeEventListener('online', syncOnReconnect);
  }, [students, ratings]);

  // Merge applicant forms into students (match by regNo or name). Add unassigned applicants as TBD under panel 2.
  useEffect(() => {
    if (!APPLICANTS || APPLICANTS.length === 0) return;

    setStudents(prev => {
      const next = [...prev];
      const existingRegMap = new Map(next.map(s => [s.regNo, s]));
      APPLICANTS.forEach(app => {
        const reg = app.regNo || '';
        let matched: Student | undefined;
        if (reg && existingRegMap.has(reg)) {
          matched = existingRegMap.get(reg);
        } else {
          // try match by name
          matched = next.find(s => s.name && app.fullName && s.name.toLowerCase().includes(app.fullName!.split(' ')[0].toLowerCase()));
        }

        if (matched) {
          // attach form
          matched.form = buildFormFromApplicant(app);
        } else {
          // add as new TBD student under panelId 0
          const newid = `s${next.length + 1}`;
          next.push({
            id: newid,
            regNo: app.regNo || `NA-${newid}`,
            name: app.fullName || (app.email || 'Unnamed'),
            timing: 'TBD',
            panelId: 0,
            status: 'pending',
            form: buildFormFromApplicant(app)
          });
        }
      });

      return next;
    });
  }, []);

  // If Supabase is configured, fetch canonical data and subscribe to realtime updates
  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    (async () => {
      try {
        await supabase.from('users').upsert(INITIAL_USERS.map(toSupabaseUserPayload), { onConflict: 'phone' });
      } catch (err) {
        console.warn('Supabase users seed sync failed', err);
      }

      try {
        const { data: uData, error: uError } = await supabase.from('users').select('*');
        if (uError) {
          console.warn('Supabase users sync failed', uError.message);
        } else if (mounted && uData) {
          const nextUsers = (uData as SupabaseUserRow[])
            .map(fromSupabaseUserRow)
            .filter((u): u is User => Boolean(u));

          if (nextUsers.length > 0) {
            setUsers(mergeUsersByPhone(nextUsers, INITIAL_USERS));
          }
        }
      } catch (err) {
        console.warn('Supabase users sync failed', err);
      }

      try {
        const { data: sData, error: sError } = await supabase.from('students').select('*');
        if (sError) {
          console.warn('Supabase students sync failed', sError.message);
        } else if (mounted && sData) {
          setStudents((prev) => {
            try {
              const builtInSchedule = INITIAL_STUDENTS.map(enrichStudentWithApplicant);
              const remoteStudents = (sData as SupabaseStudentRow[]).map(fromSupabaseStudentRow);
              const localPlusBuiltIn = mergeStudentsById(builtInSchedule, prev);
              return mergeStudentsById(localPlusBuiltIn, remoteStudents);
            } catch {
              return prev;
            }
          });
        }
      } catch (err) {
        console.warn('Supabase students sync failed', err);
      }

      try {
        const { data: rData, error: rError } = await supabase.from('ratings').select('*');
        if (rError) {
          console.warn('Supabase ratings sync failed', rError.message);
        } else if (mounted && rData) {
          setRatings((prev) => {
            try {
              return (rData as SupabaseRatingRow[]).map(fromSupabaseRatingRow);
            } catch {
              return prev;
            }
          });
        }
      } catch (err) {
        console.warn('Supabase ratings sync failed', err);
      }
    })();

    // subscribe to students and ratings changes (basic)
    try {
      const userSub = supabase.channel('public:users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        const ev = payload as unknown as RealtimePayload<SupabaseUserRow>;
        if (ev.eventType === 'INSERT' || ev.eventType === 'UPDATE') {
          const nextUser = fromSupabaseUserRow(ev.new);
          if (!nextUser) return;

          setUsers(prev => {
            const updated = prev.filter(u => u.id !== nextUser.id && u.phone !== nextUser.phone);
            return [...updated, nextUser];
          });
        }
        if (ev.eventType === 'DELETE') {
          const oldPhone = (ev.old.phone || '').trim();
          const oldId = (ev.old.id || '').trim();
          setUsers(prev => prev.filter(u => u.id !== oldId && u.phone !== oldPhone));
        }
      }).subscribe();

      const studentSub = supabase.channel('public:students').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        const ev = payload as unknown as RealtimePayload<SupabaseStudentRow>;
        if (ev.eventType === 'INSERT' || ev.eventType === 'UPDATE') {
          setStudents(prev => {
            const nextStudent = fromSupabaseStudentRow(ev.new);
            const updated = prev.filter(s => s.id !== nextStudent.id);
            return [...updated, nextStudent];
          });
        }
        if (ev.eventType === 'DELETE') {
          const oldId = ev.old.id;
          setStudents(prev => prev.filter(s => s.id !== oldId));
        }
      }).subscribe();

      const ratingSub = supabase.channel('public:ratings').on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, payload => {
        const ev = payload as unknown as RealtimePayload<SupabaseRatingRow>;
        if (ev.eventType === 'INSERT' || ev.eventType === 'UPDATE') {
          setRatings(prev => {
            const nextRating = fromSupabaseRatingRow(ev.new);
            const updated = prev.filter(r => !(r.studentId === nextRating.studentId && r.panelistId === nextRating.panelistId));
            return [...updated, nextRating];
          });
        }
        if (ev.eventType === 'DELETE') {
          const oldRating = fromSupabaseRatingRow(ev.old);
          setRatings(prev => prev.filter(r => !(r.studentId === oldRating.studentId && r.panelistId === oldRating.panelistId)));
        }
      }).subscribe();

      return () => {
        mounted = false;
        try { if (supabase && userSub) { supabase.removeChannel(userSub); } } catch {}
        try { if (supabase && studentSub) { supabase.removeChannel(studentSub); } } catch {}
        try { if (supabase && ratingSub) { supabase.removeChannel(ratingSub); } } catch {}
      };
    } catch {
      // supabase channel not available in older clients — ignore
    }
  }, []);

  // Sync to LocalStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('interview_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('interview_ratings', JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    if (currentUser) {
      if (rememberMe) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        localStorage.setItem(REMEMBER_ME_KEY, '1');
        sessionStorage.removeItem(CURRENT_USER_KEY);
      } else {
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.setItem(REMEMBER_ME_KEY, '0');
      }
      return;
    }

    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
  }, [currentUser, rememberMe]);

  // listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'interview_students' && e.newValue) {
        setStudents(JSON.parse(e.newValue));
      }
      if (e.key === 'interview_ratings' && e.newValue) {
        setRatings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (phone: string, pass: string, nameHint?: string, remember = true) => {
    const normalizedPhone = normalizePhoneForLogin(phone.trim());
    const normalizedPass = pass.trim();
    const loginUsers = buildLoginUsers(users, INITIAL_USERS);
    const candidates = loginUsers.filter((u) => normalizePhoneForLogin(u.phone.trim()) === normalizedPhone && u.password.trim() === normalizedPass);
    if (candidates.length === 0) {
      return false;
    }

    let user = candidates[0];
    const trimmedHint = (nameHint || '').trim().toLowerCase();
    if (trimmedHint) {
      const hintMatched = candidates.find(u => u.name.toLowerCase() === trimmedHint);
      if (hintMatched) {
        user = hintMatched;
      }
    }

    if (user) {
      setRememberMe(remember);
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addStudent = (newStudent: Student) => {
    const normalized = enrichStudentWithApplicant(newStudent);
    setStudents(prev => [...prev, normalized]);
    if (supabase) {
      // attempt upsert to 'students' table; table should have a primary key on `id`
      supabase
        .from('students')
        .upsert(toSupabaseStudentPayload(normalized), { onConflict: 'id' })
        .then(() => {}, (e: unknown) => console.warn('Supabase addStudent failed', e));
    }
  };

  const updateRating = (updatedRating: Rating) => {
    const normalized = normalizeRating(updatedRating);
    setRatings(prev => {
      const existingIndex = prev.findIndex(r => r.studentId === normalized.studentId && r.panelistId === normalized.panelistId);
      if (existingIndex >= 0) {
        const newRatings = [...prev];
        newRatings[existingIndex] = normalized;
        if (supabase) {
          supabase.from('ratings').upsert(toSupabaseRatingPayload(normalized), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase upsert rating failed', e));
        }
        return newRatings;
      }
      if (supabase) {
        supabase.from('ratings').upsert(toSupabaseRatingPayload(normalized), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase upsert rating failed', e));
      }
      return [...prev, normalized];
    });
  };

  const submitRating = (studentId: string, panelistId: string) => {
    // Ensure rating exists then mark submitted true
    setRatings(prev => {
      const existingIndex = prev.findIndex(r => r.studentId === studentId && r.panelistId === panelistId);
      if (existingIndex >= 0) {
        const newRatings = [...prev];
        newRatings[existingIndex] = { ...newRatings[existingIndex], submitted: true };
        if (supabase) {
          supabase.from('ratings').upsert(toSupabaseRatingPayload(newRatings[existingIndex]), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase submit rating failed', e));
        }
        return newRatings;
      }
      // create minimal rating and mark submitted
      const newR = normalizeRating({ studentId, panelistId, scores: {}, comment: '', bestDomain: '', domainPriorities: [], active: false, submitted: true } as Rating);
      if (supabase) {
        supabase.from('ratings').upsert(toSupabaseRatingPayload(newR), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase submit rating failed', e));
      }
      return [...prev, newR];
    });
  };

  const setRatingSubmitted = (studentId: string, panelistId: string, value: boolean) => {
    setRatings(prev => {
      const existingIndex = prev.findIndex(r => r.studentId === studentId && r.panelistId === panelistId);
      if (existingIndex >= 0) {
        const newRatings = [...prev];
        newRatings[existingIndex] = { ...newRatings[existingIndex], submitted: value };
        if (supabase) {
          supabase.from('ratings').upsert(toSupabaseRatingPayload(newRatings[existingIndex]), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase update rating failed', e));
        }
        return newRatings;
      }
      if (value) {
        const newR = normalizeRating({ studentId, panelistId, scores: {}, comment: '', bestDomain: '', domainPriorities: [], active: false, submitted: true } as Rating);
        if (supabase) {
          supabase.from('ratings').upsert(toSupabaseRatingPayload(newR), { onConflict: 'studentid,panelistid' }).then(() => {}, (e: unknown) => console.warn('supabase update rating failed', e));
        }
        return [...prev, newR];
      }
      return prev;
    });
  };

  const getStudentRatings = (studentId: string) => ratings.filter(r => r.studentId === studentId);

  const getOverallScore = (studentId: string) => {
    const studentRatings = getStudentRatings(studentId);
    if (studentRatings.length === 0) return 0;

    let totalScore = 0;
    let count = 0;

    studentRatings.forEach(r => {
      const values = Object.values(r.scores).filter((value): value is number => typeof value === 'number');
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        totalScore += avg;
        count++;
      }
    });

    return count === 0 ? 0 : (totalScore / count);
  };

  return (
    <DataContext.Provider value={{
      currentUser,
      users,
      students,
      ratings,
      login,
      logout,
      addStudent,
      updateRating,
      submitRating,
      setRatingSubmitted,
      getStudentRatings,
      getOverallScore
    }}>
      {children}
    </DataContext.Provider>
  );
};
