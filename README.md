# akilahapigateway

> **🔐 SECURITY NOTICE:** This repository uses environment variables for all sensitive credentials. Never commit your `.env` file to version control. See [Environment Setup](#environment-setup) for details.

> **📚 Comprehensive Project Analysis Available:** See [START-HERE.md](./START-HERE.md) for complete documentation including market analysis, technical architecture, and investor briefing.

A unified API Gateway for GitHub, Notion, and Firebase deployed to Google Cloud Run with auto-scaling.

## 🚀 Quick Links

- **[START HERE](./START-HERE.md)** - Navigation guide and decision framework
- **[Executive Summary](./EXECUTIVE-SUMMARY.md)** - 15-minute overview for investors
- **[Complete Analysis](./PROJECT-ANALYSIS-INVESTOR-BRIEF.md)** - Full market and technical analysis
- **[Architecture Docs](./ARCHITECTURE-AND-FEATURES.md)** - Technical deep-dive with diagrams
- **[Action Plan](./DETAILED-ACTION-PLAN.md)** - Step-by-step redeployment guide

## Project Overview

A locally tested API Gateway deployed to Cloud Run with auto-scaling, GitHub activation, and public access.

- Tested with curl, Google Cloud, and GNU[ADI]
- With multiple endpoints/routes handling defined in index.js

- Response to /gbt tests IOK:

   curl -X POST https://akilahapigateway-858627689875.us-central1.run.app/gpt \
  -H Content-Type: application/json \
  -d {\"message\": \"Hello from client!\"}


## Project: akilahstack

- Cloud Run Service: `akilahapigateway`
- Region: `us-central1`
- Live at: https://akilahapigateway-858627689875.us-central1.run.app

- Alrenate service: `firebase-adminsdk-fbsvc`
- Live at: https://firebase-adminsdk-fbsvc-858627689875.us-central1.run.app
- Purpose: Used by Firebase infrastructure or additional config (not traffic)

## Routes: 

- /gbt
  /notion
  /ping/trace
  /   (endpoint, healthcheck test)

- Notion server route confirms to be receiving regular REQ structure and JSON

## Environment Setup

### Required Environment Variables

The following environment variables **must** be set for the application to start:

- `FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_REGION` - Google Cloud Region  
- `GITHUB_PAT` - GitHub Personal Access Token
- `NOTION_TOKEN` - Notion Integration Token

### Setup Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials in `.env`:**
   - Never commit the `.env` file to version control
   - The `.env` file is already in `.gitignore`
   - See `.env.example` for all available configuration options

3. **Generate required credentials:**
   - **GitHub PAT:** https://github.com/settings/tokens
   - **Notion Integration:** https://www.notion.so/my-integrations
   - **Firebase:** https://console.firebase.google.com/
   - **Google Cloud:** https://console.cloud.google.com/

4. **Verify setup:**
   ```bash
   npm start
   ```
   You should see "✅ Environment validation passed" if all required variables are set.

### Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Rotate credentials regularly
- ✅ Use principle of least privilege for all service accounts
- ✅ Review [SECURITY-REVIEW-AND-ACTION-PLAN.md](./SECURITY-REVIEW-AND-ACTION-PLAN.md) for comprehensive security guidelines
- ✅ Enable 2FA on all integrated services
- ✅ Monitor access logs for unauthorized activity


## Cloud Run Service Account
- `858627689875-compute@developer.gserviceaccount.com`
   - Roles added:
    * logging.logWriter
    * cloudbuild.builds.editor


## Deployment via GitHub Actions
- Automated on `main` branch push
- Uses `run-deploy` command with `gcloud` and gives service access
- Service is set to run as unauthenticated

- Via repo: https://github.com/incrediblesadi/akilahapigateway


## Insights for Future Mentenance

- Seedling checkpoint in `index.js`
- Fallback route "/
 - Make sure template strings like this `  `console.log(`application running on port ${PORT}`)` `
- Always look for "Received GTP request" logs in Cloud Logs



[tree will be auto-inserted here]
