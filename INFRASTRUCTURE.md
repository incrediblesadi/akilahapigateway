# Akilah System Infrastructure

Complete audit of all Firebase/Google Cloud resources and GitHub repositories.

**Last Updated:** February 17, 2026  
**Account:** google@akilah.io  
**GitHub:** @incrediblesadi

---

## Google Cloud Build Configuration

### Active Project: `akilahstack` (#858627689875)

**Region:** us-central1 (migrated from global in late 2025)  
**Account:** google@akilah.io  
**Status:** ✅ OPERATIONAL (Fixed Feb 17, 2026)

### Cloud Build Triggers

| Trigger Name | Repository | Branch | Filename | Service Account | Status |
|--------------|------------|---------|----------|-----------------|--------|
| akilahapigateway-deploy | incrediblesadi/akilahapigateway | main | cloudbuild.yaml | 858627689875-compute | ✅ ACTIVE |
| Cloudbuild | incrediblesadi/akilahapigateway | main | (auto-detect) | 858627689875-compute | ⚠️ LEGACY |

**Note:** The "Cloudbuild" trigger (created Jun 4, 2025) is a legacy auto-detected trigger. Recommend deleting after verifying new trigger works.

### Build History (Recent)

| Build ID | Status | Date | Region | Error |
|----------|--------|------|--------|-------|
| 0bc755a6 | ✅ SUCCESS | Feb 18, 2026 | us-central1 | - |
| 36a3bdcf | ❌ FAILURE | Feb 16, 2026 | us-central1 | Logging options required |
| 3a77efd6 | ❌ FAILURE | Feb 11, 2026 | us-central1 | Logging options required |
| 6f39fffe | ❌ FAILURE | Feb 10, 2026 | us-central1 | Logging options required |
| 335cdac3 | ❌ FAILURE | Feb 10, 2026 | us-central1 | Logging options required |
| 6c73612f | ❌ FAILURE | Feb 10, 2026 | us-central1 | Logging options required |
| cbb66dae | ✅ SUCCESS | Jan 1, 2026 | us-central1 | - |
| f84c144d | ✅ SUCCESS | Jun 3, 2025 | global | - (Last global build) |

### Regional Migration Impact (Dec 2025 - Feb 2026)

**Issue:** Google Cloud migrated Cloud Build triggers from `global` region to `us-central1` (regional).

**Breaking Change:**
- **Before (global region):** Service accounts could build without explicit logging configuration
- **After (regional):** Service accounts REQUIRE explicit `options: logging: CLOUD_LOGGING_ONLY` in cloudbuild.yaml

**Error Message:**
```
if 'build.service_account' is specified, the build must either:
(a) specify 'build.logs_bucket'
(b) use REGIONAL_USER_OWNED_BUCKET
(c) use CLOUD_LOGGING_ONLY / NONE logging options: invalid argument
```

**Resolution:** Added minimal cloudbuild.yaml with proper logging configuration (Feb 17, 2026)

### cloudbuild.yaml Configuration (akilahapigateway)

**Location:** `incrediblesadi/akilahapigateway/cloudbuild.yaml`  
**Commit:** a839838  
**Created:** Feb 17, 2026

```yaml
# Cloud Build configuration for akilahapigateway
# Wraps existing Dockerfile with proper logging config for regional builds

steps:
  # Build Docker image using existing Dockerfile
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/github.com/$REPO_FULL_NAME:$SHORT_SHA'
      - '-f'
      - 'Dockerfile'
      - '.'
    id: 'build-image'

  # Push image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/github.com/$REPO_FULL_NAME:$SHORT_SHA'
    id: 'push-image'

# Required for regional builds with service accounts
options:
  logging: CLOUD_LOGGING_ONLY  # ✅ FIXES REGIONAL BUILD ERROR
  machineType: 'N1_HIGHCPU_8'

timeout: '1200s'

images:
  - 'gcr.io/$PROJECT_ID/github.com/$REPO_FULL_NAME:$SHORT_SHA'
```

**Key Features:**
- Minimal wrapper around existing Dockerfile
- `logging: CLOUD_LOGGING_ONLY` satisfies regional build requirements
- Uses Cloud Build substitution variables: `$PROJECT_ID`, `$REPO_FULL_NAME`, `$SHORT_SHA`
- Machine type: N1_HIGHCPU_8 (8 vCPUs, 7.2 GB RAM)
- Timeout: 1200s (20 minutes)
- Stores images in Container Registry metadata

### Service Accounts

**Primary Build Account:** `858627689875-compute@developer.gserviceaccount.com`
- **Roles:** 70+ including roles/owner, roles/secretmanager.secretAccessor
- **Purpose:** Cloud Run application runtime identity + Cloud Build execution
- **Access:** All 20 secrets in Secret Manager (GitHub, Google OAuth, OpenAI, Meta, LinkedIn, Notion APIs)
- **Used by:** Cloud Build triggers, Cloud Run services, Firebase deployments

### Dual Deployment Architecture

**System 1: Cloud Build (Automatic Image Building)**
- **Trigger:** Push to main branch
- **Action:** Builds Docker image, pushes to gcr.io
- **Output:** `gcr.io/akilahstack/github.com/incrediblesadi/akilahapigateway:[commit-sha]`
- **Purpose:** Automatic container image creation

**System 2: GitHub Actions (Manual Deployment)**
- **Trigger:** workflow_dispatch (manual button click)
- **Action:** Deploys pre-built image to Cloud Run
- **Environments:** staging, production
- **Purpose:** Controlled deployment timing

**Workflow:** Code push → Cloud Build creates image → Manual GitHub Actions deployment when ready

### Artifact Registry

**Total Storage:** 13.4 GB
- gcr.io (us): 8.2 GB
- cloud-run-source-deploy (us-central1): 4 GB

**Image Path:** `gcr.io/akilahstack/github.com/incrediblesadi/akilahapigateway:$COMMIT_SHA`

### Cloud Logging

- **_Default bucket:** 30-day retention
- **_Required bucket:** 400-day retention (LOCKED)
- **Status:** ✅ OPERATIONAL
- **Mode:** CLOUD_LOGGING_ONLY (required for regional builds with service accounts)

---

## Google Cloud Projects

### akilahstack (akilahsystems) - PRIMARY

**Project ID:** akilahstack  
**Project Number:** #858627689875  
**Owner:** google@akilah.io (roles/owner)  
**Status:** ✅ ACTIVE  
**Region:** us-central1

**Key Services:**
- Cloud Build (138 enabled APIs)
- Cloud Run
- Secret Manager (20 secrets)
- Firebase (Realtime DB, Hosting, Storage)
- Artifact Registry (13.4 GB)
- Cloud Logging

### Other Projects

**akilah-memory (#75561070726)**
- 107 enabled APIs
- Maps Platform, Firebase, Cloud Run

**akilahchatgpt (#861099753792)**  
**akilahnew (#875437096833)**

---

## Secret Manager (20 Secrets)

### GitHub Tokens
- github-token
- Github_FindGraind_Path ⚠️ (typo: should be FineGrained?)
- Sadi-github-oauthtoken-2e7c74
- cental1-github-oauthtoken-68bc2c ⚠️ (typo: should be central1?)
- firebase-app-hosting-github-oauth-github-oauthtoken-ea14cb
- host-github-oauthtoken-20f7e1
- incrediblesadi-github-oauthtoken-1d7239

### Google OAuth
- google-client-id
- google-client-secret
- GCP_ClintId ⚠️ (typo: should be ClientId?)
- GCP_Secret

### API Keys
- openai-api-key
- notion-api-key
- linkedin-client-id
- linkedin-client-secret

### Meta/Marketing
- MetaMarketingAPI
- MetABusiness
- MarketingGetAccess

### System
- nextauth-secret
- default_compute_service_account

---

## References

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Regional Migration Guide](https://cloud.google.com/build/docs/locations)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
