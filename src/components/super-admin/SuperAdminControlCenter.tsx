'use client';

import { useMemo, useState } from 'react';
import { useData } from '@/context/DataProvider';
import type { Student } from '@/lib/data';
import clsx from 'clsx';
import { ClipboardList, LogOut } from 'lucide-react';
import { leaveSession } from '@/lib/auth/session';

type Section = 'overview' | 'candidates' | 'panelists' | 'panels' | 'leaderboard' | 'system' | 'import';

const sections: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'panelists', label: 'Panelists' },
  { id: 'panels', label: 'Panels' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'system', label: 'System' },
  { id: 'import', label: 'Candidate Import' }
];

function countBy<T>(items: T[], predicate: (value: T) => boolean) {
  return items.filter(predicate).length;
}

export function SuperAdminControlCenter() {
  const {
    currentUser,
    users,
    students,
    ratings,
    listPanels,
    createPanelist,
    updateUser,
    updatePanelMemberships,
    createCandidate,
    updateCandidate,
    getOverallScore,
    setViewAsPanelist,
    lastError
  } = useData();
  const [section, setSection] = useState<Section>('overview');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [panelIdsInputByUser, setPanelIdsInputByUser] = useState<Record<string, string>>({});

  const activeStudents = useMemo(() => students.filter((student) => student.isActive !== false), [students]);
  const panelists = useMemo(() => users, [users]);
  const filteredPanelists = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return panelists;
    return panelists.filter((user) => `${user.name} ${user.phone || ''} ${user.displayTitle || ''}`.toLowerCase().includes(search));
  }, [panelists, query]);
  const filteredCandidates = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return students;
    return students.filter((student) => `${student.name} ${student.regNo} ${student.form?.email || ''}`.toLowerCase().includes(search));
  }, [students, query]);
  const topCandidates = useMemo(
    () =>
      activeStudents
        .map((student) => ({ student, score: getOverallScore(student.id) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    [activeStudents, getOverallScore]
  );

  if (!currentUser || currentUser.role !== 'super_admin') return null;

  const run = async (work: () => Promise<boolean>, successMessage: string) => {
    setBusy(true);
    setMessage('');
    const ok = await work();
    setBusy(false);
    setMessage(ok ? successMessage : 'Action failed. Check permissions/configuration.');
  };

  const handleAddPanelist = () => {
    const name = window.prompt('Panelist full name');
    if (!name) return;
    const phone = window.prompt('Phone number');
    if (!phone) return;
    const password = window.prompt('Initial password');
    if (!password) return;
    void run(
      () =>
        createPanelist({
          displayName: name,
          phone,
          password,
          displayTitle: 'Panelist',
          role: 'panelist',
          panelIds: [1]
        }),
      'Panelist created.'
    );
  };

  const handleAddCandidate = () => {
    const name = window.prompt('Candidate full name');
    const regNo = window.prompt('Registration number');
    if (!name || !regNo) return;
    const timing = window.prompt('Timing', 'TBD') || 'TBD';
    const dayRaw = (window.prompt('Day (day-1, day-2, unscheduled)', 'day-1') || 'day-1').trim();
    const day: Student['day'] =
      dayRaw === 'day-2' || dayRaw === 'unscheduled' ? dayRaw : 'day-1';
    const panelId = window.prompt('Panel (1 or 2)', '1') === '2' ? 2 : 1;
    void run(
      () =>
        createCandidate({
          name,
          regNo,
          panelId,
          day,
          timing,
          status: 'pending'
        }),
      'Candidate created.'
    );
  };

  const handleLogout = () => {
    leaveSession();
  };

  return (
    <div className="min-h-dvh bg-gray-950 text-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 rounded-xl border border-gray-800 bg-gray-950/95 backdrop-blur p-4 md:p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Super Admin Control Center</h1>
          <p className="mt-2 text-sm text-gray-400">Manage users, candidates, and live interview data.</p>
          {message ? <p className="mt-3 text-sm text-blue-300">{message}</p> : null}
          {lastError ? <p className="mt-3 text-sm text-red-300">{lastError.message}</p> : null}
        </div>
        <div className="hidden md:flex md:flex-wrap md:items-center gap-2">
          <button
            type="button"
            onClick={() => setViewAsPanelist(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <ClipboardList className="h-4 w-4" />
            Interview
          </button>
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>

      <nav className="rounded-xl border border-gray-800 bg-gray-900/50 p-2 -mx-3 px-3 sm:mx-0 sm:px-2 overflow-x-auto">
        <div className="flex min-w-max gap-2">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={clsx(
              'min-h-10 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
              section === item.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {item.label}
          </button>
        ))}
        </div>
      </nav>

      {(section === 'panelists' || section === 'candidates') ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={section === 'panelists' ? 'Search panelists...' : 'Search candidates...'}
            className="w-full min-h-11 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ) : null}

      {section === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard title="Candidates (Total)" value={students.length} />
          <StatCard title="Candidates (Active)" value={activeStudents.length} />
          <StatCard title="Pending" value={countBy(activeStudents, (student) => student.status === 'pending')} />
          <StatCard title="Interviewing" value={countBy(activeStudents, (student) => student.status === 'interviewing')} />
          <StatCard title="Completed" value={countBy(activeStudents, (student) => student.status === 'completed')} />
          <StatCard title="Day 1" value={countBy(activeStudents, (student) => student.day === 'day-1')} />
          <StatCard title="Day 2" value={countBy(activeStudents, (student) => student.day === 'day-2')} />
          <StatCard title="Unscheduled" value={countBy(activeStudents, (student) => student.day === 'unscheduled')} />
          <StatCard title="Panel 1" value={countBy(activeStudents, (student) => student.panelId === 1)} />
          <StatCard title="Panel 2" value={countBy(activeStudents, (student) => student.panelId === 2)} />
          <StatCard title="Panelists (Total)" value={panelists.length} />
          <StatCard title="Panelists (Active)" value={countBy(panelists, (user) => user.isActive !== false)} />
          <StatCard title="Senior Panelists" value={countBy(users, (user) => user.role === 'senior_panelist')} />
          <StatCard title="Admins" value={countBy(users, (user) => user.role === 'admin')} />
          <StatCard title="Super Admins" value={countBy(users, (user) => user.role === 'super_admin')} />
          <StatCard title="Interview Ratings Submitted" value={countBy(ratings, (rating) => rating.submitted)} />
          <StatCard title="Interviews Remaining" value={Math.max(activeStudents.length - countBy(ratings, (rating) => rating.submitted), 0)} />
        </div>
      )}

      {section === 'panelists' && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">People</h2>
            <button
              type="button"
              disabled={busy}
              onClick={handleAddPanelist}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              Add Panelist
            </button>
          </div>
          <div className="space-y-3 md:hidden">
            {filteredPanelists.map((user) => (
              <div key={user.id} className="rounded-xl border border-gray-800 bg-gray-950/50 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.role} · {user.displayTitle || '—'}</div>
                    <div className="text-xs text-gray-500">Panels {(user.panelIds || []).join(', ') || '—'} · {user.isActive === false ? 'inactive' : 'active'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className="min-h-10 rounded border border-gray-700 px-3 text-xs" onClick={() => {
                    const displayName = window.prompt('Display name', user.name);
                    if (!displayName) return;
                    const displayTitle = window.prompt('Title', user.displayTitle || '') ?? user.displayTitle;
                    const roleRaw = window.prompt('Role (panelist, senior_panelist, admin, super_admin)', user.role) || user.role;
                    const role = roleRaw === 'senior_panelist' || roleRaw === 'admin' || roleRaw === 'super_admin' || roleRaw === 'panelist' ? roleRaw : user.role;
                    void run(() => updateUser(user.id, { displayName, displayTitle: displayTitle || undefined, role }), 'Person updated.');
                  }}>Edit</button>
                  <button type="button" disabled={busy} className="min-h-10 rounded border border-gray-700 px-3 text-xs" onClick={() => {
                    const phone = window.prompt('Phone number', user.phone || '');
                    if (!phone) return;
                    void run(() => updateUser(user.id, { phone }), 'Phone updated.');
                  }}>Phone</button>
                  <input
                    value={panelIdsInputByUser[user.id] ?? (user.panelIds || []).join(',')}
                    onChange={(e) => setPanelIdsInputByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                    className="min-h-10 w-24 rounded border border-gray-700 bg-gray-950 px-2 text-xs"
                  />
                  <button type="button" disabled={busy} className="min-h-10 rounded border border-gray-700 px-3 text-xs" onClick={() => {
                    const panelIds = (panelIdsInputByUser[user.id] ?? '').split(',').map((v) => Number(v.trim())).filter((v) => v === 1 || v === 2);
                    void run(() => updatePanelMemberships(user.id, panelIds), 'Panel memberships updated.');
                  }}>Panels</button>
                  <button type="button" disabled={busy} className="min-h-10 rounded border border-red-800 px-3 text-xs text-red-300" onClick={() => {
                    void run(() => updateUser(user.id, { isActive: user.isActive === false }), user.isActive === false ? 'Panelist reactivated.' : 'Panelist deactivated.');
                  }}>{user.isActive === false ? 'Reactivate' : 'Deactivate'}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Role</th>
                  <th className="py-2 text-left">Title</th>
                  <th className="py-2 text-left">Panels</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPanelists.map((user) => (
                  <tr key={user.id} className="border-t border-gray-800">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.role}</td>
                    <td className="py-2">{user.displayTitle || '-'}</td>
                    <td className="py-2">{(user.panelIds || []).join(', ') || '-'}</td>
                    <td className="py-2">{user.isActive === false ? 'inactive' : 'active'}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-gray-700 px-2 py-1 text-xs hover:bg-gray-800"
                          onClick={() => {
                            const displayName = window.prompt('Display name', user.name);
                            if (!displayName) return;
                            const displayTitle = window.prompt('Title', user.displayTitle || '') ?? user.displayTitle;
                            const roleRaw = window.prompt('Role (panelist, senior_panelist, admin, super_admin)', user.role) || user.role;
                            const role =
                              roleRaw === 'senior_panelist' || roleRaw === 'admin' || roleRaw === 'super_admin' || roleRaw === 'panelist'
                                ? roleRaw
                                : user.role;
                            void run(
                              () => updateUser(user.id, { displayName, displayTitle: displayTitle || undefined, role }),
                              'Person updated.'
                            );
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-gray-700 px-2 py-1 text-xs hover:bg-gray-800"
                          onClick={() => {
                            const phone = window.prompt('Phone number', user.phone || '');
                            if (!phone) return;
                            void run(() => updateUser(user.id, { phone }), 'Phone updated.');
                          }}
                        >
                          Phone
                        </button>
                        <input
                          value={panelIdsInputByUser[user.id] ?? (user.panelIds || []).join(',')}
                          onChange={(e) => setPanelIdsInputByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                          className="w-20 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-gray-700 px-2 py-1 text-xs hover:bg-gray-800"
                          onClick={() => {
                            const panelIds = (panelIdsInputByUser[user.id] ?? '')
                              .split(',')
                              .map((v) => Number(v.trim()))
                              .filter((v) => v === 1 || v === 2);
                            void run(() => updatePanelMemberships(user.id, panelIds), 'Panel memberships updated.');
                          }}
                        >
                          Manage Panels
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-red-800 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                          onClick={() => {
                            void run(() => updateUser(user.id, { isActive: user.isActive === false }), user.isActive === false ? 'Panelist reactivated.' : 'Panelist deactivated.');
                          }}
                        >
                          {user.isActive === false ? 'Reactivate' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'candidates' && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Candidate Management</h2>
            <button
              type="button"
              disabled={busy}
              onClick={handleAddCandidate}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              Add Candidate
            </button>
          </div>
          <div className="space-y-3 md:hidden">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-xl border border-gray-800 bg-gray-950/50 p-3 space-y-2">
                <div className="font-semibold">{candidate.name}</div>
                <div className="text-xs text-gray-400">{candidate.regNo} · {candidate.day} · Panel {candidate.panelId} · {candidate.timing}</div>
                <div className="text-xs text-gray-500">{candidate.isActive === false ? 'inactive' : candidate.status}</div>
                <CandidateActions candidate={candidate} busy={busy} onSave={async (updates) => {
                  await run(() => updateCandidate(candidate.id, updates), 'Candidate updated.');
                }} />
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="py-2 text-left">Reg No</th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Email</th>
                  <th className="py-2 text-left">Phone</th>
                  <th className="py-2 text-left">Day</th>
                  <th className="py-2 text-left">Panel</th>
                  <th className="py-2 text-left">Timing</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    busy={busy}
                    onSave={async (updates) => {
                      await run(() => updateCandidate(candidate.id, updates), 'Candidate updated.');
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'panels' && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 md:p-6 space-y-4">
          <h2 className="text-xl font-semibold">Panel Overview</h2>
          <button
            type="button"
            className="rounded border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800"
            onClick={() => {
              void run(async () => {
                await listPanels();
                return true;
              }, 'Panel list refreshed.');
            }}
          >
            Refresh Panels
          </button>
          <p className="text-sm text-gray-400">Panel membership changes are managed from the Panelists section.</p>
        </section>
      )}

      {section === 'leaderboard' && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Leaderboard Snapshot</h2>
          <div className="space-y-2">
            {topCandidates.length === 0 ? (
              <p className="text-sm text-gray-500">No scored candidates yet.</p>
            ) : (
              topCandidates.map((item, index) => (
                <div key={item.student.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
                  <span className="text-sm text-gray-300">#{index + 1} {item.student.name}</span>
                  <span className="text-sm font-semibold text-blue-300">{item.score.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {section === 'system' && (
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 md:p-6 space-y-2">
          <h2 className="text-xl font-semibold">System</h2>
          <p className="text-sm text-gray-400">Phase 3 foundation is active. Import and integration workflows are intentionally deferred to later phases.</p>
          <p className="text-sm text-gray-500">Realtime foundation is enabled through DataProvider subscriptions for profiles, panel memberships, candidates, applications, and ratings.</p>
        </section>
      )}

      {section === 'import' && (
        <section className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-6">
          <h2 className="text-xl font-semibold">Candidate Import</h2>
          <p className="mt-2 text-sm text-gray-400">Placeholder for Phase 4. Spreadsheet upload and mapping are not implemented in this phase.</p>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-2 gap-2 p-3">
          <button
            type="button"
            onClick={() => setViewAsPanelist(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            <ClipboardList className="h-4 w-4" />
            Interview
          </button>
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-800 bg-red-950/40 px-3 text-sm font-semibold text-red-200"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-blue-300">{value}</div>
    </div>
  );
}

function CandidateRow({
  candidate,
  busy,
  onSave
}: {
  candidate: Student;
  busy: boolean;
  onSave: (updates: {
    panelId?: number;
    day?: Student['day'];
    timing?: string;
    status?: Student['status'];
    isActive?: boolean;
    name?: string;
    regNo?: string;
    form?: Student['form'];
  }) => Promise<void>;
}) {
  return (
    <tr className="border-t border-gray-800">
      <td className="py-2">{candidate.regNo}</td>
      <td className="py-2">{candidate.name}</td>
      <td className="py-2">{candidate.form?.email || '-'}</td>
      <td className="py-2">{candidate.form?.phone || '-'}</td>
      <td className="py-2">{candidate.day}</td>
      <td className="py-2">Panel {candidate.panelId}</td>
      <td className="py-2">{candidate.timing}</td>
      <td className="py-2">{candidate.isActive === false ? 'inactive' : candidate.status}</td>
      <td className="py-2">
        <CandidateActions candidate={candidate} busy={busy} onSave={onSave} />
      </td>
    </tr>
  );
}

function CandidateActions({
  candidate,
  busy,
  onSave
}: {
  candidate: Student;
  busy: boolean;
  onSave: (updates: {
    panelId?: number;
    day?: Student['day'];
    timing?: string;
    status?: Student['status'];
    isActive?: boolean;
    name?: string;
    regNo?: string;
    form?: Student['form'];
  }) => Promise<void>;
}) {
  const btn = 'min-h-10 rounded border border-gray-700 px-3 text-xs hover:bg-gray-800';
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const name = window.prompt('Name', candidate.name);
          if (!name) return;
          const regNo = window.prompt('Registration number', candidate.regNo);
          if (!regNo) return;
          const timing = window.prompt('Timing', candidate.timing);
          if (timing == null) return;
          void onSave({ name, regNo, timing });
        }}
      >
        Edit
      </button>
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const email = window.prompt('Email', candidate.form?.email || '');
          if (email == null) return;
          const phone = window.prompt('Phone', candidate.form?.phone || '');
          if (phone == null) return;
          const program = window.prompt('Program', candidate.form?.program || '');
          if (program == null) return;
          void onSave({
            form: {
              ...(candidate.form || {}),
              email,
              phone,
              program
            }
          });
        }}
      >
        Contact
      </button>
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const domains = window.prompt('Preferred domains', candidate.form?.domains || '');
          if (domains == null) return;
          const whyInterested = window.prompt('Why interested', candidate.form?.whyInterested || '');
          if (whyInterested == null) return;
          void onSave({
            form: {
              ...(candidate.form || {}),
              domains,
              whyInterested
            }
          });
        }}
      >
        Application
      </button>
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const nextPanel = candidate.panelId === 1 ? 2 : 1;
          void onSave({ panelId: nextPanel });
        }}
      >
        Change Panel
      </button>
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const nextDay: Student['day'] =
            candidate.day === 'day-1' ? 'day-2' : candidate.day === 'day-2' ? 'unscheduled' : 'day-1';
          void onSave({ day: nextDay });
        }}
      >
        Change Day
      </button>
      <button
        type="button"
        disabled={busy}
        className={btn}
        onClick={() => {
          const nextStatus: Student['status'] =
            candidate.status === 'pending' ? 'interviewing' : candidate.status === 'interviewing' ? 'completed' : 'pending';
          void onSave({ status: nextStatus });
        }}
      >
        Change Status
      </button>
      <button
        type="button"
        disabled={busy}
        className="min-h-10 rounded border border-red-800 px-3 text-xs text-red-300 hover:bg-red-950/40"
        onClick={() => {
          void onSave({ isActive: candidate.isActive === false });
        }}
      >
        {candidate.isActive === false ? 'Reactivate' : 'Deactivate'}
      </button>
    </div>
  );
}
