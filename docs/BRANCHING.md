# Branching Strategy

This project uses a two-branch workflow aligned with Vercel deployments.

## Branches

| Branch | Purpose | Vercel |
|--------|---------|--------|
| `main` | Production-ready code | Production deployment |
| `development` | Integration and pre-release testing | Preview deployments (default branch for PRs) |

## Workflow

```
feature/my-change
        │
        ▼  (pull request)
  development  ──►  Vercel preview URL for testing
        │
        ▼  (pull request, when ready for production)
      main  ──►  Vercel production deployment
```

## Rules

1. **Do not push directly to `main`** except for hotfixes agreed by the team.
2. Create feature branches from `development`:
   ```bash
   git checkout development
   git pull
   git checkout -b feature/short-description
   ```
3. Open a pull request into `development` for review and preview deploy.
4. Merge to `main` only when `development` is stable and tested.
5. Never commit `.env.local`, `.env`, or files under `backups/`.

## Hotfixes

For urgent production fixes:

```bash
git checkout main
git pull
git checkout -b hotfix/short-description
# fix, commit, PR to main
# cherry-pick or merge back into development
```

## First-time setup

After the initial push to `main`:

```bash
git checkout -b development
git push -u origin development
```

Set `development` as the default branch for new pull requests in GitHub repository settings if you prefer all work to flow through previews first.
