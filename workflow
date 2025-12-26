# Deployment Workflow Documentation

## Overview
This file tracks the deployment logic for the Akilah API Gateway project.

## Current Deployment Setup

### Main Branch Deployment
- **Trigger**: Push to `main` branch
- **Target**: Google Cloud Run service `akilahapigateway`
- **Region**: us-central1
- **Platform**: Cloud Run (managed)
- **Configuration**: `.github/workflows/deploy.yml`
- **Paths Monitored**: 
  - `src/backend/**`
  - `.github/workflows/deploy.yml`

### Deployment Process
1. Code is pushed to main branch
2. GitHub Actions workflow is triggered
3. Authenticates with Google Cloud using service account
4. Deploys to Cloud Run service

## Multi-Branch Deployment Capability

### Can We Deploy Both Main and Dashboard Branches Simultaneously?

**Answer: YES**, with proper configuration.

### Approach 1: Separate Cloud Run Services (Recommended)
Deploy each branch to a different Cloud Run service:

- **Main branch** → `akilahapigateway-production`
- **Dashboard branch** → `akilahapigateway-dashboard`

**Benefits:**
- Complete isolation between environments
- Independent scaling and configuration
- No conflicts or interference
- Easy rollback per environment

**Implementation:**
1. Duplicate `.github/workflows/deploy.yml` for dashboard branch
2. Modify service name in dashboard workflow
3. Configure different environment variables if needed

### Approach 2: Using Service Revisions
Deploy both branches to the same service but with traffic splitting:

- Main branch → 100% traffic (production)
- Dashboard branch → 0% traffic (testing/preview)

**Benefits:**
- Single service management
- Easy A/B testing
- Shared infrastructure

**Drawbacks:**
- More complex traffic management
- Potential for production impact

### Approach 3: Different Regions
Deploy branches to different geographical regions:

- Main branch → us-central1 (primary)
- Dashboard branch → us-east1 (secondary/test)

## Dashboard Branch Deployment Configuration

### Recommended Setup
Create a new workflow file: `.github/workflows/deploy-dashboard.yml`

```yaml
name: Deploy Dashboard to Cloud Run

on:
  push:
    branches:
      - dashboard
    paths:
      - 'src/backend/**'
      - '.github/workflows/deploy-dashboard.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Auth to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy akilahapigateway-dashboard \
            --image gcr.io/akilahstack/akilahapigateway-dashboard \
            --service-account 858627689875-compute@developer.gserviceaccount.com \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

## Deployment Tracking

### Main Branch Deployments
- Last deployment: [To be tracked]
- Status: Active
- URL: [To be configured]

### Dashboard Branch Deployments
- Last deployment: [To be tracked]
- Status: Pending setup
- URL: [To be configured]

## Next Steps

1. **For Dashboard Branch Deployment:**
   - Create `.github/workflows/deploy-dashboard.yml`
   - Configure GCP service `akilahapigateway-dashboard`
   - Set up environment variables for dashboard environment
   - Test deployment pipeline

2. **Environment Configuration:**
   - Configure separate secrets for dashboard if needed
   - Set up monitoring and logging for both services
   - Configure custom domains if required

3. **Testing Strategy:**
   - Validate dashboard deployment doesn't affect main
   - Test both services can run simultaneously
   - Verify resource allocation and costs

## Conclusion

**Yes, both main and dashboard branches can be deployed simultaneously** using separate Cloud Run services. This is the recommended approach as it provides:
- Environment isolation
- Independent deployment cycles
- No risk of cross-contamination
- Clear separation of concerns

The current infrastructure supports this pattern with minimal additional configuration.
