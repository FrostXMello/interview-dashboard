'use client';

import { useEffect, useRef, useState } from 'react';
import { useData } from '@/context/DataProvider';
import { canManageCandidateStatus } from '@/lib/auth/roles';
import { CRITERIA, DOMAIN_OPTIONS, DOMAIN_SHORT_LABELS, RANKING_TABS, DOMAIN_PRIORITY_POINTS, canonicalizeDomain, extractPreferredDomains, skillRating, SKILL_LABELS, type DomainOption, type InterviewDay } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { LogOut, Star, User as UserIcon, CheckCircle, ChevronRight, BarChart3, Users, Save, Search, Loader2, Shield } from 'lucide-react';
import clsx from 'clsx';
import { SuperAdminControlCenter } from '@/components/super-admin/SuperAdminControlCenter';
import { leaveSession } from '@/lib/auth/session';

const normalizeAnswerSpacing = (text?: string) => {
  if (!text) return '—';

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseTimingStartMinutes = (timing: string) => {
  const normalized = (timing || '').replace(/[–—]/g, '-').trim();
  const firstChunk = normalized.split('-')[0]?.trim();
  if (!firstChunk || firstChunk.toUpperCase() === 'TBD') return Number.POSITIVE_INFINITY;

  const match = firstChunk.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.POSITIVE_INFINITY;

  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  let hour = hourRaw % 12;
  if (meridiem === 'PM') hour += 12;

  return hour * 60 + minute;
};

export default function Dashboard() {
  const router = useRouter();
  const {
    currentUser,
    students,
    users,
    ratings,
    updateRating,
    submitRating,
    setRatingSubmitted,
    setStudentStatus,
    getOverallScore,
    getStudentRatings,
    appMode,
    isDemoSession,
    lastError,
    syncStatus,
    viewAsPanelist,
    setViewAsPanelist
  } = useData();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'candidates' | 'evaluation' | 'leaderboard'>('candidates');
  const [listFilter, setListFilter] = useState<'all' | 'unscheduled' | 'day-1' | 'day-2'>('all');
  const [activeTab, setActiveTab] = useState<'panel1' | 'panel2' | 'all'>('all');
  const [rankingTab, setRankingTab] = useState<(typeof RANKING_TABS)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const commentDirtyRef = useRef(false);

  useEffect(() => {
    if (currentUser || syncStatus === 'loading') return;
    const timer = window.setTimeout(() => {
      router.replace('/');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [currentUser, router, syncStatus]);

  useEffect(() => {
    commentDirtyRef.current = false;
  }, [selectedStudentId, currentUser?.id]);

  useEffect(() => {
    if (!currentUser || !selectedStudentId || !commentDirtyRef.current) return;
    const timer = window.setTimeout(() => {
      const rating = ratings.find(
        (r) => r.studentId === selectedStudentId && r.panelistId === currentUser.id
      );
      if ((rating?.comment || '') === commentDraft) {
        commentDirtyRef.current = false;
        return;
      }
      commentDirtyRef.current = false;
      updateRating({
        studentId: selectedStudentId,
        panelistId: currentUser.id,
        scores: rating?.scores || {},
        comment: commentDraft,
        bestDomain: rating?.bestDomain || '',
        domainPriorities: rating?.domainPriorities || [],
        submitted: rating?.submitted || false,
        active: rating?.active || false
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [commentDraft, currentUser, selectedStudentId, ratings, updateRating]);

  useEffect(() => {
    if (!currentUser || commentDirtyRef.current) return;
    const rating = ratings.find(
      (r) => r.studentId === selectedStudentId && r.panelistId === currentUser.id
    );
    const next = rating?.comment || '';
    setCommentDraft((prev) => (prev === next ? prev : next));
  }, [currentUser, selectedStudentId, ratings]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 text-gray-400">
        <Loader2 className="mb-3 h-6 w-6 animate-spin text-blue-500" />
        <p className="text-sm">{syncStatus === 'loading' ? 'Loading session…' : 'Redirecting to sign in…'}</p>
      </div>
    );
  }

  if (currentUser.role === 'super_admin' && !viewAsPanelist) {
    return <SuperAdminControlCenter />;
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedPreferredDomains = extractPreferredDomains(selectedStudent?.form?.domains);

  const getStudentDay = (student: { day?: InterviewDay; id: string }): InterviewDay =>
    student.day || (student.id.startsWith('d2-') ? 'day-2' : 'day-1');

  const completedStudentIds = new Set(
    ratings
      .filter((rating) => typeof rating.scores?.['Interview Score'] === 'number')
      .map((rating) => rating.studentId)
  );

  // Filter students
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredStudents = students.filter(s => {
    if (s.isActive === false) return false;
    const day = getStudentDay(s);
    const isUnscheduled = day === 'unscheduled';
    if (listFilter === 'unscheduled') return isUnscheduled;
    if (listFilter === 'day-1') {
      if (day !== 'day-1') return false;
    } else if (listFilter === 'day-2') {
      if (day !== 'day-2') return false;
    }
    if (!isUnscheduled) {
      if (activeTab === 'panel1') return s.panelId === 1;
      if (activeTab === 'panel2') return s.panelId === 2;
    }
    return true;
  }).filter((student) => {
    if (!normalizedSearch) return true;
    return student.name.toLowerCase().includes(normalizedSearch) || student.regNo.toLowerCase().includes(normalizedSearch);
  }).sort((a, b) => {
    const aTime = parseTimingStartMinutes(a.timing);
    const bTime = parseTimingStartMinutes(b.timing);
    if (aTime !== bTime) return aTime - bTime;
    if (a.panelId !== b.panelId) return a.panelId - b.panelId;
    return a.name.localeCompare(b.name);
  });

  // Current user's rating for selected student
  const myRating = ratings.find(r => r.studentId === selectedStudentId && r.panelistId === currentUser.id) || {
    studentId: selectedStudentId || '',
    panelistId: currentUser.id,
    scores: {},
    comment: '',
    bestDomain: '',
    domainPriorities: [],
    submitted: false,
    active: false
  };

  const myDomainPriorities = (Array.isArray(myRating.domainPriorities) ? myRating.domainPriorities : [])
    .map((domain) => canonicalizeDomain(domain))
    .filter((domain): domain is NonNullable<typeof domain> => Boolean(domain));

  const hasRatingContent = (rating: typeof myRating) => {
    const hasNumericScore = Object.values(rating.scores).some((value) => typeof value === 'number' && value > 0);
    const hasComment = Boolean(rating.comment?.trim());
    const hasPriorities = Array.isArray(rating.domainPriorities) && rating.domainPriorities.length > 0;
    return hasNumericScore || hasComment || hasPriorities;
  };

  const handleScoreChange = (criteria: string, val: number) => {
    if (val < 1 || val > 10) return;
    // Toggle: if clicking the same rating again, remove it
    const current = typeof myRating.scores[criteria] === 'number' ? myRating.scores[criteria] : undefined;
    const newScores = { ...myRating.scores };
    if (current === val) {
      delete newScores[criteria];
    } else {
      newScores[criteria] = val;
    }
    updateRating({
      ...myRating,
      scores: newScores,
      comment: commentDraft
    });
  };

  const handleCommentChange = (val: string) => {
    commentDirtyRef.current = true;
    setCommentDraft(val);
  };

  const commitCommentDraft = () => {
    if (myRating.comment === commentDraft) {
      commentDirtyRef.current = false;
      return;
    }
    commentDirtyRef.current = false;
    updateRating({ ...myRating, comment: commentDraft });
  };

  const handlePriorityDomainToggle = (domain: DomainOption) => {
    const existing = myDomainPriorities;
    let next: DomainOption[];

    if (existing.includes(domain)) {
      next = existing.filter((item) => item !== domain);
    } else if (existing.length < 3) {
      next = [...existing, domain];
    } else {
      next = existing;
    }

    updateRating({
      ...myRating,
      domainPriorities: next,
      bestDomain: next[0] || '',
      comment: commentDraft
    });
  };

  const moveDomainPriority = (fromIndex: number, toIndex: number) => {
    const list = [...myDomainPriorities];
    if (toIndex < 0 || toIndex >= list.length) return;

    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    updateRating({
      ...myRating,
      domainPriorities: list,
      bestDomain: list[0] || '',
      comment: commentDraft
    });
  };

  const handleSubmit = () => {
    if (selectedStudentId) {
      submitRating(selectedStudentId, currentUser.id);
    }
  };

  const handleClearEvaluation = () => {
    commentDirtyRef.current = false;
    setCommentDraft('');
    updateRating({
      ...myRating,
      scores: {},
      comment: '',
      bestDomain: '',
      domainPriorities: [],
      submitted: false,
      active: false
    });
  };

  // Calculate stats
  const studentsWithScores = students.filter((s) => s.isActive !== false).map(s => ({
    ...s,
    avgScore: getOverallScore(s.id)
  })).sort((a, b) => b.avgScore - a.avgScore);

  const overallLeaderboardRows = studentsWithScores.filter((s) => s.avgScore > 0);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('evaluation');
    }
  };

  const getDomainPriorityAverage = (studentId: string, domain: DomainOption) => {
    const liveRatings = ratings.filter((r) => r.studentId === studentId && Array.isArray(r.domainPriorities) && r.domainPriorities.length > 0);
    if (liveRatings.length === 0) return 0;

    const totalPoints = liveRatings.reduce((acc, rating) => {
      const priorities = (Array.isArray(rating.domainPriorities) ? rating.domainPriorities : [])
        .map((item) => canonicalizeDomain(item))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const idx = priorities.indexOf(domain);
      if (idx === -1 || idx > 2) return acc;
      return acc + DOMAIN_PRIORITY_POINTS[idx];
    }, 0);

    return totalPoints / liveRatings.length;
  };

  const rankingRows = students
    .filter((student) => student.isActive !== false)
    .map((student) => {
      const avgScore = getOverallScore(student.id);
      const domainPoints = rankingTab === 'all' ? 0 : getDomainPriorityAverage(student.id, rankingTab);
      return {
        ...student,
        avgScore,
        domainPoints,
        rankingScore: rankingTab === 'all' ? avgScore : domainPoints * 100 + avgScore
      };
    })
    .filter((student) => {
      if (rankingTab === 'all') return student.avgScore > 0;
      return student.domainPoints > 0;
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);

  const visiblePanelFeedback = (selectedStudentId ? getStudentRatings(selectedStudentId) : []).filter((rating) => {
    return hasRatingContent(rating as typeof myRating);
  });

  return (
    <div className="flex h-dvh flex-col lg:flex-row bg-gray-950 text-gray-100 overflow-hidden font-sans pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Sidebar / Student List */}
      <div className={clsx(
        'w-full lg:w-80 lg:h-full min-h-0 flex-1 lg:flex-none flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900/50',
        mobileView === 'candidates' ? 'flex' : 'hidden lg:flex'
      )}>
        <div className="p-4 border-b border-gray-800">
          {(isDemoSession || appMode === 'offline-demo' || lastError) && (
            <div className="mb-3 rounded-lg border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-200/90 space-y-1">
              <div>
                {appMode === 'offline-demo' || isDemoSession
                  ? 'Offline demo — synthetic data; not a production auth session.'
                  : `Sync: ${syncStatus}`}
              </div>
              {lastError && <div className="text-red-300">{lastError.message}</div>}
            </div>
          )}
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Candidates
          </h2>
          {currentUser.role === 'super_admin' && (
            <button
              type="button"
              onClick={() => setViewAsPanelist(false)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-700/50 bg-blue-950/40 px-3 py-2 text-xs font-medium text-blue-200 hover:bg-blue-900/50"
            >
              <Shield className="h-3.5 w-3.5" />
              Back to Super Admin
            </button>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Completed interviews: {filteredStudents.filter((student) => completedStudentIds.has(student.id)).length}
          </div>
          <div className="flex mt-4 gap-1 bg-gray-800 p-1 rounded-lg">
            {([
              { id: 'all', label: 'All' },
              { id: 'unscheduled', label: 'Unscheduled' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListFilter(tab.id)}
                className={clsx(
                  'flex-1 min-h-10 text-xs font-medium py-2 rounded-md transition-colors',
                  listFilter === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex mt-2 gap-1 bg-gray-800 p-1 rounded-lg">
            {([
              { id: 'day-1', label: 'Day 1' },
              { id: 'day-2', label: 'Day 2' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListFilter(tab.id)}
                className={clsx(
                  'flex-1 min-h-10 text-xs font-medium py-2 rounded-md transition-colors',
                  listFilter === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex mt-4 gap-1 bg-gray-800 p-1 rounded-lg">
            {(['all', 'panel1', 'panel2'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "flex-1 min-h-10 text-xs font-medium py-2 rounded-md capitalize transition-colors",
                  activeTab === tab ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
                )}
              >
                  {tab === 'all' ? 'All' : tab.replace('panel', 'Panel ')}
              </button>
            ))}
          </div>
          <div className="mt-3 relative">
            <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or reg no"
              className="w-full min-h-11 pl-9 pr-3 py-2.5 rounded-lg bg-gray-950 border border-gray-800 text-base text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredStudents.length > 0 ? filteredStudents.map(student => {
            const computedStatus = completedStudentIds.has(student.id)
              ? 'completed'
              : student.status;
            const preferredDomains = extractPreferredDomains(student.form?.domains);

            return (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student.id)}
                className={clsx(
                  "w-full text-left p-3.5 min-h-[4.25rem] rounded-xl border transition-all group relative",
                  selectedStudentId === student.id
                    ? "bg-blue-900/20 border-blue-500/50 text-white"
                    : "bg-gray-900/30 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{student.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {student.day === 'unscheduled'
                        ? `${student.regNo} • Unscheduled • All panels`
                        : `${student.regNo} • ${student.timing}`}
                    </div>
                    {preferredDomains.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {preferredDomains.map((domain) => (
                          <span
                            key={domain}
                            className="inline-flex max-w-full items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-blue-200"
                          >
                            {DOMAIN_SHORT_LABELS[domain] || domain}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={clsx(
                    "text-xs px-2 py-0.5 rounded-full",
                    computedStatus === 'completed' ? "bg-green-900/30 text-green-400" :
                    computedStatus === 'interviewing' ? "bg-amber-900/30 text-amber-400" :
                    "bg-gray-800 text-gray-500"
                  )}>
                    {computedStatus}
                  </div>
                </div>
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </button>
            );
          }) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-500">
              {syncStatus === 'loading' ? 'Loading candidates…' : 'No candidates found for this search.'}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <div className="text-sm font-medium truncate">{currentUser.name}</div>
               <div className="text-xs text-gray-500 capitalize">
                 {currentUser.role === 'super_admin' && viewAsPanelist
                   ? 'Interviewing as panelist'
                   : currentUser.displayTitle || currentUser.role}
               </div>
             </div>
             <button
               type="button"
               aria-label="Log out"
               onClick={leaveSession}
               className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
             >
               <LogOut className="h-5 w-5" />
             </button>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={clsx('flex-1 min-h-0 flex overflow-hidden relative', mobileView === 'candidates' ? 'hidden lg:flex' : 'flex')}>
        {selectedStudent ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Header */}
            <header className="px-4 md:px-8 py-5 md:py-6 border-b border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 bg-gray-950 sticky top-0 z-10">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{selectedStudent.name}</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-gray-400 text-sm">
                  <span>{selectedStudent.regNo}</span>
                  <span>•</span>
                  <span>{selectedStudent.panelId === 0 ? 'TBD' : `Panel ${selectedStudent.panelId}`}</span>
                  <span>•</span>
                  <span>{selectedStudent.timing}</span>
                </div>
                {selectedPreferredDomains.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPreferredDomains.map((domain) => (
                      <span
                        key={`header-${domain}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-full border border-blue-500/35 bg-blue-500/10 text-blue-200 text-xs font-semibold"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Overall Score</div>
                <div className="text-3xl md:text-4xl font-black text-blue-500 leading-none">
                  {getOverallScore(selectedStudent.id).toFixed(1)}
                  <span className="text-lg text-gray-600 font-medium align-top ml-1">/10</span>
                </div>
              </div>
            </header>

            <div className="p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
              {/* Application Details */}
              <div className={clsx(
                'bg-gradient-to-br from-gray-900/70 via-gray-900/40 to-slate-950/50 border border-slate-800 rounded-2xl p-6 md:p-7 shadow-[0_10px_40px_-20px_rgba(96,165,250,0.55)]',
                mobileView === 'leaderboard' ? 'hidden lg:block' : ''
              )}>
                <h4 className="text-lg text-blue-200 font-bold mb-5 tracking-wide">Application Details</h4>
                {selectedStudent.form ? (
                  <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-7 text-sm text-gray-100">
                    <div className="space-y-3">
                      <div><span className="font-semibold text-gray-400">Name:</span> {selectedStudent.form.fullName || '—'}</div>
                      <div><span className="font-semibold text-gray-400">Reg No:</span> {selectedStudent.form.regNo || '—'}</div>
                      <div><span className="font-semibold text-gray-400">Email:</span> {selectedStudent.form.email || '—'}</div>
                      <div><span className="font-semibold text-gray-400">Phone:</span> {selectedStudent.form.phone || '—'}</div>
                      <div><span className="font-semibold text-gray-400">Program:</span> {selectedStudent.form.program || '—'}</div>
                      <div><span className="font-semibold text-gray-400">Commitment:</span> {selectedStudent.form.commitment ? `${selectedStudent.form.commitment}/5` : '—'}</div>
                      <div><span className="font-semibold text-gray-400">CV:</span> {selectedStudent.form.cvLink ? <a href={selectedStudent.form.cvLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Open link</a> : '—'}</div>
                      <div className="pt-1">
                        <div className="font-semibold text-gray-400 mb-2">
                          Preferred Domains
                          {selectedPreferredDomains.length > 1 ? ` (${selectedPreferredDomains.length})` : ''}
                        </div>
                        {selectedPreferredDomains.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedPreferredDomains.map((domain) => (
                              <li
                                key={domain}
                                className="rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-100"
                              >
                                {domain}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">{selectedStudent.form.domains?.trim() || '—'}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="font-semibold text-gray-400 mb-1">Why Interested (Raw Response)</div>
                        <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2.5 text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {normalizeAnswerSpacing(selectedStudent.form.whyInterested)}
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-gray-400 mb-1">Experience (Raw Response)</div>
                        <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2.5 text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {normalizeAnswerSpacing(selectedStudent.form.experience)}
                        </div>
                      </div>

                      {selectedStudent.form.proficiencies && (
                        <div>
                          <div className="font-semibold text-gray-400 mb-1">Self-Rated Skills</div>
                          <div className="grid grid-cols-2 gap-2">
                            {SKILL_LABELS.map((key) => (
                              <div key={key} className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs">
                                <span className="text-gray-500">{key}</span>
                                <div className="text-gray-200 font-semibold mt-0.5">{skillRating(selectedStudent.form?.proficiencies, key)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No application data — TBD</div>
                )}
              </div>

              {/* Evaluation & Panel Feedback - Side by Side */}
              <div className={clsx('grid grid-cols-1 lg:grid-cols-2 gap-8', mobileView === 'leaderboard' ? 'hidden lg:grid' : '')}>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Your Evaluation
                  </h3>
                  
                  <div className="space-y-6">
                    {CRITERIA.map((criterion) => (
                      <div key={criterion} className="space-y-2">
                         <div className="flex justify-between items-center text-sm">
                           <label className="text-gray-300 font-medium">{criterion} (1-10)</label>
                           <span className={clsx("font-bold", (typeof myRating.scores[criterion] === 'number' ? (myRating.scores[criterion] as number) : 0) > 0 ? "text-blue-400" : "text-gray-600")}>
                             {typeof myRating.scores[criterion] === 'number' ? myRating.scores[criterion] : '-'}
                           </span>
                         </div>
                         <div className="grid grid-cols-5 gap-2">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                             <button
                               key={num}
                               onClick={() => !myRating.submitted && handleScoreChange(criterion, num)}
                               disabled={myRating.submitted}
                               className={clsx(
                                 "min-h-11 rounded-lg text-sm font-semibold transition-all border",
                                 (myRating.scores[criterion] === num)
                                   ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                   : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 hover:border-gray-600"
                               )}
                             >
                               {num}
                             </button>
                           ))}
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3">
                    <label className="text-sm font-medium text-gray-300">Best-Suited Domains (priority order, choose up to 3)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DOMAIN_OPTIONS.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => !myRating.submitted && handlePriorityDomainToggle(domain)}
                          disabled={myRating.submitted}
                          className={clsx(
                            'min-h-11 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                            myDomainPriorities.includes(domain)
                              ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow'
                              : 'border-gray-700 bg-gray-800/70 text-gray-300 hover:bg-gray-700/80'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{domain}</span>
                            <span className="flex items-center gap-1">
                              {selectedPreferredDomains.includes(domain) && (
                                <span className="text-[10px] uppercase tracking-wide text-blue-300">Preferred</span>
                              )}
                              {myDomainPriorities.includes(domain) && (
                                <span className="text-xs font-black text-cyan-200">P{myDomainPriorities.indexOf(domain) + 1}</span>
                              )}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                      {myDomainPriorities.length > 0 ? (
                        <div className="space-y-2">
                          {myDomainPriorities.map((domain, index) => (
                            <div key={domain} className="flex items-center justify-between gap-3 text-sm">
                              <div className="text-gray-200">
                                <span className="text-cyan-300 font-semibold mr-2">P{index + 1}</span>{domain}
                              </div>
                              {!myRating.submitted && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveDomainPriority(index, index - 1)}
                                    className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 disabled:opacity-40"
                                  >
                                    Up
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === myDomainPriorities.length - 1}
                                    onClick={() => moveDomainPriority(index, index + 1)}
                                    className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 disabled:opacity-40"
                                  >
                                    Down
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No domains selected yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 space-y-2">
                    <label className="text-sm font-medium text-gray-300">Interview Comments</label>
                    <textarea
                      value={commentDraft}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      onBlur={commitCommentDraft}
                      disabled={myRating.submitted}
                      placeholder="Write your interview comments here..."
                      className="w-full min-h-24 bg-gray-950 border border-gray-800 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      {!myRating.submitted && hasRatingContent(myRating) && (
                        <button
                          onClick={() => {
                            commitCommentDraft();
                            if (confirm('Clear this evaluation draft?')) {
                              handleClearEvaluation();
                            }
                          }}
                          className="px-3 py-1 rounded bg-red-700/70 text-xs text-white hover:bg-red-600"
                        >
                          Clear Evaluation
                        </button>
                      )}
                      {myRating.submitted && (
                        <button
                          onClick={() => {
                            if (confirm('Re-open evaluation for editing?')) {
                              setRatingSubmitted(selectedStudent.id, currentUser.id, false);
                            }
                          }}
                          className="px-3 py-1 rounded bg-yellow-600 text-xs text-white hover:bg-yellow-500"
                        >
                          Edit Evaluation
                        </button>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          commitCommentDraft();
                          handleSubmit();
                        }}
                        disabled={myRating.submitted || typeof myRating.scores['Interview Score'] !== 'number' || myDomainPriorities.length === 0}
                        className={clsx(
                          "flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all",
                          myRating.submitted
                            ? "bg-green-600/20 text-green-500 cursor-default"
                            : (typeof myRating.scores['Interview Score'] !== 'number' || myDomainPriorities.length === 0)
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                        )}
                      >
                        {myRating.submitted ? (
                          <><CheckCircle className="h-5 w-5" /> Submitted</>
                        ) : (
                          <><Save className="h-5 w-5" /> Submit Evaluation</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Live Panel Ratings */}
                  <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Panel Feedback (Real-time)
                    </h3>

                    <div className="space-y-4">
                      {visiblePanelFeedback.length > 0 ? (
                        visiblePanelFeedback.map((rating) => {
                          const panelist = users.find(u => u.id === rating.panelistId);
                          const panelistName = panelist?.name || 'Panelist';
                          const panelistRole = panelist?.displayTitle || panelist?.role || 'panelist';
                          const isMe = rating.panelistId === currentUser.id;

                          const interviewScore =
                            typeof rating.scores['Interview Score'] === 'number'
                              ? rating.scores['Interview Score']
                              : null;
                          const displayScore = interviewScore !== null ? String(interviewScore) : '-';

                          return (
                            <div key={rating.panelistId} className={clsx('p-4 rounded-lg border', isMe ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800/50 border-gray-700')}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-semibold text-sm flex items-center gap-2">
                                    {panelistName}
                                    {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase">You</span>}
                                    {!rating.submitted && (
                                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase">Live</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">{panelistRole}</div>
                                </div>
                                <div className="text-2xl font-bold text-gray-200">{displayScore}</div>
                              </div>
                              {Array.isArray(rating.domainPriorities) && rating.domainPriorities.length > 0 && (
                                <div className="text-xs text-cyan-300 mb-1">
                                  Priority: <span className="font-semibold">{rating.domainPriorities.map((domain, i) => `P${i + 1} ${domain}`).join(' | ')}</span>
                                </div>
                              )}
                              {rating.comment && (
                                <p className="text-sm text-gray-400 italic mt-2">&quot;{rating.comment}&quot;</p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">No ratings yet</div>
                      )}
                    </div>
                  </div>

                  {/* Status Card */}
                  {canManageCandidateStatus(currentUser.role) && selectedStudent && (
                    <div className="bg-gray-900/30 border border-amber-900/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4 text-amber-500">Admin Controls</h3>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-400">Manage candidate status</div>
                        <div className="flex gap-2">
                          {(['pending', 'interviewing', 'completed'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                void setStudentStatus(selectedStudent.id, st);
                              }}
                              className={clsx(
                                'px-3 py-1 bg-gray-800 rounded text-xs capitalize hover:bg-gray-700 border border-gray-700',
                                selectedStudent.status === st && 'border-amber-500 text-amber-300'
                              )}
                            >
                              Set {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={clsx('grid grid-cols-1 xl:grid-cols-2 gap-8', mobileView === 'evaluation' ? 'hidden lg:grid' : '')}>
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    Overall Interview Leaderboard
                  </h3>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {overallLeaderboardRows.length > 0 ? (
                      overallLeaderboardRows.map((student, index) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student.id)}
                          className="w-full text-left rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 flex items-center justify-between gap-3 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500">#{index + 1}</div>
                            <div className="text-sm font-semibold text-gray-100 truncate">{student.name}</div>
                            <div className="text-xs text-gray-500 truncate">{student.regNo}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-emerald-300">{student.avgScore.toFixed(1)}</div>
                            <div className="text-[10px] uppercase tracking-wide text-gray-500">Avg Score</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-8 text-center">No submitted interviews yet.</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Domain Rankings
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {RANKING_TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRankingTab(tab)}
                        className={clsx(
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          rankingTab === tab
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        )}
                      >
                        {tab === 'all' ? 'All' : DOMAIN_SHORT_LABELS[tab]}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {rankingRows.length > 0 ? (
                      rankingRows.map((student, index) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student.id)}
                          className="w-full text-left rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 flex items-center justify-between gap-3 hover:border-blue-500/40 hover:bg-blue-500/10 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500">#{index + 1}</div>
                            <div className="text-sm font-semibold text-gray-100 truncate">{student.name}</div>
                            <div className="text-xs text-gray-500 truncate">{student.regNo}</div>
                          </div>
                          <div className="text-right">
                            {rankingTab === 'all' ? (
                              <>
                                <div className="text-xl font-bold text-blue-300">{student.avgScore.toFixed(1)}</div>
                                <div className="text-[10px] uppercase tracking-wide text-gray-500">Avg Score</div>
                              </>
                            ) : (
                              <>
                                <div className="text-xl font-bold text-cyan-300">{student.domainPoints.toFixed(2)}</div>
                                <div className="text-[10px] uppercase tracking-wide text-gray-500">Avg Priority Points</div>
                              </>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-8 text-center">
                        {rankingTab === 'all' ? 'No scores available yet.' : 'No domain priority votes for this domain yet.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-8 bg-gray-950/50 overflow-y-auto">
            <div className="mx-auto max-w-5xl grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <div className={clsx('rounded-2xl border border-gray-800 bg-gray-900/40 p-8 text-center', mobileView === 'leaderboard' ? 'hidden lg:block' : '')}>
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-xl border border-gray-800 mx-auto">
                  <UserIcon className="h-10 w-10 text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-300 mb-2">Select a Candidate</h2>
                <p className="max-w-md mx-auto text-gray-500">Choose a candidate from the sidebar to view details, start evaluation, or view real-time feedback from the panel.</p>
              </div>

              <div className={clsx('w-full bg-gray-900/40 border border-gray-800 rounded-xl p-6', mobileView === 'leaderboard' ? 'block' : 'hidden lg:block')}>
                <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-100">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Overall Interview Leaderboard
                </h3>
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 text-left">
                  {overallLeaderboardRows.length > 0 ? overallLeaderboardRows.map((student, index) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className="w-full text-left rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 flex items-center justify-between gap-3 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">#{index + 1}</div>
                        <div className="text-sm font-semibold text-gray-100 truncate">{student.name}</div>
                        <div className="text-xs text-gray-500 truncate">{student.regNo}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-300">{student.avgScore.toFixed(1)}</div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Avg Score</div>
                      </div>
                    </button>
                  )) : (
                    <div className="text-sm text-gray-500 py-8 text-center">No submitted interviews yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Leaderboard (Right sidebar - Collapsible or dedicated?) */}
        {/* I'll make it a discrete column visible on large screens */}
        <div className="w-72 border-l border-gray-800 bg-gray-900/30 hidden 2xl:flex flex-col">
          <div className="p-4 border-b border-gray-800">
             <h3 className="font-bold flex items-center gap-2">
               <BarChart3 className="h-5 w-5 text-green-500" />
               Leaderboard
             </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {studentsWithScores.filter(s => s.avgScore > 0).map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="w-full text-left p-3 bg-gray-900/50 rounded-lg border border-gray-800 flex items-center gap-3 hover:border-green-500/40 hover:bg-green-500/10 transition-colors"
              >
                 <div className="text-lg font-black text-gray-600">#{idx + 1}</div>
                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-semibold truncate">{s.name}</div>
                   <div className="text-xs text-blue-400 font-mono">{s.avgScore.toFixed(2)} / 10</div>
                 </div>
              </button>
            ))}
            {studentsWithScores.filter(s => s.avgScore > 0).length === 0 && (
               <div className="p-4 text-center text-gray-600 text-sm">No scores submitted yet.</div>
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800 bg-gray-900/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1.5">
          {[
            { key: 'candidates', label: 'Candidates', icon: Users },
            { key: 'evaluation', label: 'Evaluate', icon: Star },
            { key: 'leaderboard', label: 'Ranks', icon: BarChart3 }
          ].map((item) => {
            const Icon = item.icon;
            const active = mobileView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMobileView(item.key as typeof mobileView)}
                className={clsx(
                  'flex min-h-12 min-w-[5.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-xs font-medium transition-colors',
                  active ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
