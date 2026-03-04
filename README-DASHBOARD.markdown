# Dashboard Branch Repository Map

This document provides a snapshot of the current repository structure with file and folder sizes.

- **Branch:** `work`
- **Generated:** `2026-03-04 12:25:29 UTC`

## Repository Tree (with sizes)

```text
akilahapigateway/ (209.2 KB)
├── .github/ (6.0 KB)
│   └── workflows/ (6.0 KB)
│       ├── auto-file-contents.yml (396 B)
│       ├── deploy-auto-tag.yml (714 B)
│       ├── deploy.yml (750 B)
│       ├── deployStatus.yml (644 B)
│       ├── env-sync.yml (822 B)
│       ├── env-to-secrets.yml (896 B)
│       ├── generate-repo-map.yml (1.4 KB)
│       └── test.yml (472 B)
├── bin/ (273 B)
│   └── env-to-secrets (273 B)
├── src/ (39.3 KB)
│   ├── backend/ (2.5 KB)
│   │   ├── __tests__/ (1005 B)
│   │   │   └── deploy.test.js (1005 B)
│   │   ├── index.js (1.0 KB)
│   │   └── README.md (478 B)
│   ├── GitHubRoutes/ (16.0 KB)
│   │   ├── codespaces.js (1.3 KB)
│   │   ├── deploys.js (1.7 KB)
│   │   ├── files.js (2.0 KB)
│   │   ├── gists.js (1.6 KB)
│   │   ├── hooks.js (1.6 KB)
│   │   ├── issues.js (1.7 KB)
│   │   ├── repos.js (1.5 KB)
│   │   ├── secrets.js (1.8 KB)
│   │   ├── settings.js (1.3 KB)
│   │   └── workflows.js (1.5 KB)
│   ├── NotionRoutes/ (5.3 KB)
│   │   ├── append-to-page.js (862 B)
│   │   ├── create-page.js (1.1 KB)
│   │   ├── edit-request.js (708 B)
│   │   ├── get-overview.js (881 B)
│   │   ├── index.js (453 B)
│   │   ├── notionPages.js (791 B)
│   │   └── read-block.js (564 B)
│   ├── routes/ (2.5 KB)
│   │   ├── loader.js (504 B)
│   │   ├── logger.js (778 B)
│   │   └── notes.js (1.2 KB)
│   ├── sdk/ (1.8 KB)
│   │   ├── firebaseClient.js (669 B)
│   │   ├── githubClient.js (1005 B)
│   │   └── notionClient.js (195 B)
│   ├── session/ (5.1 KB)
│   │   ├── buildCurrentSession.js (2.3 KB)
│   │   ├── currentSession.json (2.2 KB)
│   │   ├── index.js (193 B)
│   │   └── rebuild.js (471 B)
│   ├── env-to-github-secrets.js (5.4 KB)
│   ├── firebase.js (356 B)
│   └── index.js (337 B)
├── test/ (3.4 KB)
│   └── env-to-github-secrets.test.js (3.4 KB)
├── .dockerignore (581 B)
├── .env (2.0 KB)
├── .env.example (1.3 KB)
├── .gitignore (304 B)
├── ARCHITECTURE-AND-FEATURES.md (50.2 KB)
├── CHANGELOG.md (24 B)
├── DETAILED-ACTION-PLAN.md (42.4 KB)
├── Dockerfile (242 B)
├── EXECUTIVE-SUMMARY.md (12.9 KB)
├── package-lock.json (527 B)
├── package.json (534 B)
├── PROJECT-ANALYSIS-INVESTOR-BRIEF.md (27.9 KB)
├── README-ENV-TO-SECRETS.md (2.0 KB)
├── README.md (2.4 KB)
├── remodel-plan.md (201 B)
├── REPO MAP.md (1.0 KB)
├── REPO-MAP_DEV.md (382 B)
├── START-HERE.md (11.5 KB)
└── workflow (4.0 KB)
```

## Top 15 Largest Files

| Rank | File | Size |
|---:|---|---:|
| 1 | `ARCHITECTURE-AND-FEATURES.md` | 50.2 KB |
| 2 | `DETAILED-ACTION-PLAN.md` | 42.4 KB |
| 3 | `PROJECT-ANALYSIS-INVESTOR-BRIEF.md` | 27.9 KB |
| 4 | `EXECUTIVE-SUMMARY.md` | 12.9 KB |
| 5 | `START-HERE.md` | 11.5 KB |
| 6 | `src/env-to-github-secrets.js` | 5.4 KB |
| 7 | `workflow` | 4.0 KB |
| 8 | `test/env-to-github-secrets.test.js` | 3.4 KB |
| 9 | `README.md` | 2.4 KB |
| 10 | `src/session/buildCurrentSession.js` | 2.3 KB |
| 11 | `src/session/currentSession.json` | 2.2 KB |
| 12 | `src/GitHubRoutes/files.js` | 2.0 KB |
| 13 | `README-ENV-TO-SECRETS.md` | 2.0 KB |
| 14 | `.env` | 2.0 KB |
| 15 | `src/GitHubRoutes/secrets.js` | 1.8 KB |

## Directory Size Summary

| Directory | Total Size |
|---|---:|
| `.github` | 6.0 KB |
| `.` | 209.2 KB |
| `bin` | 273 B |
| `src` | 39.3 KB |
| `test` | 3.4 KB |
