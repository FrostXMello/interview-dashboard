# Git History Remediation (Manual)

## Why this is needed

Earlier commits of this repository included:

- Plaintext panelist passwords in `src/lib/data.ts`
- Real-looking applicant PII (names, emails, phones, essays) in `src/lib/applicants.ts`

Those strings may still exist in Git history even after the working tree is scrubbed.

**This document does not rewrite history.** Destructive history rewriting must be an explicit, coordinated operator action.

## Recommended operator steps

1. **Rotate all exposed credentials** that ever appeared in the repo (treat them as compromised).
2. Make the GitHub repository **private** until history is cleaned (if it is currently public).
3. Decide on a rewrite strategy with the team:
   - `git filter-repo` (preferred) or BFG Repo-Cleaner to purge sensitive paths/strings
   - Or archive the old repo and push a fresh root commit to a new repository
4. Force-push only after confirming all collaborators are ready (rewrites shared history).
5. Invalidate any Supabase anon/service keys that may have been committed or shared.
6. Notify affected individuals if real personal data was exposed (legal/compliance as applicable).

## Verification after rewrite

```bash
git log -S "password" --oneline -- src/lib/data.ts
git grep -n "password" $(git rev-list --all) -- '*.ts' '*.tsx' || true
```

Ensure no production phones, emails, or passwords remain in any commit reachable from the default branch.
