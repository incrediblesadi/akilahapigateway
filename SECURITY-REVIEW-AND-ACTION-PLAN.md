# Security Review and Action Plan

**Date:** January 2, 2026  
**Project:** Akila API Gateway  
**Status:** 🔴 CRITICAL SECURITY ISSUES IDENTIFIED

---

## 🚨 CRITICAL SECURITY VULNERABILITIES

### 1. **SEVERITY: CRITICAL** - Exposed Credentials in Git Repository

**Issue:** The `.env` file containing real production credentials is tracked in git and committed to the public GitHub repository.

**Exposed Credentials:**
- Google Cloud Platform credentials (Client ID, Client Secret, API Key, Service Account)
- Firebase credentials (Database URL, Storage Bucket)
- GitHub OAuth credentials (Client ID, Client Secret, PAT)
- LinkedIn API credentials (Client ID, Client Secret, Profile PAT)
- AWS credentials (Access Key ID, Secret Access Key, Amplify credentials)
- Notion API credentials (Client ID, Client Secret, Workspace ID, Integration Secret)

**Impact:**
- ⚠️ Unauthorized access to all integrated services
- ⚠️ Potential data breach in Firebase database
- ⚠️ Unauthorized GitHub repository access
- ⚠️ AWS resource abuse and potential financial charges
- ⚠️ Notion workspace data exposure

**Immediate Actions Required:**
1. ✅ **ROTATE ALL CREDENTIALS IMMEDIATELY** - All exposed credentials must be revoked and regenerated
2. ✅ Remove `.env` from git tracking
3. ✅ Clean git history (if possible) or document the exposure
4. ✅ Audit all service logs for unauthorized access
5. ✅ Implement secrets management solution (Google Secret Manager or similar)

---

### 2. **SEVERITY: HIGH** - Hardcoded Token in Source Code

**File:** `src/sdk/notionClient.js`  
**Line:** 4  
**Issue:** Notion API token hardcoded as fallback value

```javascript
auth: process.env.NOTION_TOKEN || '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'
```

**Impact:**
- Token exposed in source code and git history
- If environment variable is not set, hardcoded token is used
- Potential unauthorized Notion workspace access

**Actions Required:**
1. ✅ Remove hardcoded token
2. ✅ Revoke the exposed token via Notion admin panel
3. ✅ Generate new Notion integration token
4. ✅ Fail gracefully if environment variable is not set (don't use fallback)
5. ✅ Add validation to ensure NOTION_TOKEN is set before server starts

---

### 3. **SEVERITY: MEDIUM** - No API Authentication

**Issue:** The API Gateway has no authentication mechanism for incoming requests.

**Current State:**
- All endpoints are publicly accessible
- No API key validation
- No rate limiting
- No request authentication

**Impact:**
- Unlimited public access to GitHub, Notion, and Firebase APIs
- Potential abuse and resource exhaustion
- Security vulnerabilities for downstream services

**Actions Required:**
1. ✅ Implement API key authentication middleware
2. ✅ Add rate limiting per API key
3. ✅ Implement request validation and sanitization
4. ✅ Add CORS configuration
5. ✅ Add authentication documentation

---

### 4. **SEVERITY: MEDIUM** - Placeholder Token in GitHub Client

**File:** `src/sdk/githubClient.js`  
**Line:** 4  
**Issue:** Placeholder token 'your-actual-token' used as fallback

```javascript
auth: process.env.GITHUB_PAT || 'your-actual-token'
```

**Impact:**
- GitHub API calls will fail if GITHUB_PAT is not set
- Misleading fallback value in source code

**Actions Required:**
1. ✅ Remove placeholder fallback
2. ✅ Validate GITHUB_PAT environment variable on startup
3. ✅ Add proper error handling for missing credentials

---

## 📋 COMPREHENSIVE ACTION PLAN

### Phase 1: EMERGENCY SECURITY RESPONSE (Day 1 - IMMEDIATE)

**Priority:** 🔴 CRITICAL  
**Timeline:** 0-4 hours  
**Status:** ⏳ PENDING

#### Step 1.1: Revoke All Exposed Credentials
- [ ] **Google Cloud Platform**
  - [ ] Revoke Client ID: `858627689875-koph5qg98e7d4...`
  - [ ] Revoke Client Secret: `GOCSPX-D1-ymvc50zMd4eagU6...`
  - [ ] Revoke API Key: `AIzaSyAoLav5bpvhbniKItzL...`
  - [ ] Review service account permissions
  - [ ] Generate new credentials

- [ ] **GitHub**
  - [ ] Revoke OAuth Client ID: `Iv23lihyaNMQ7jQilfsR`
  - [ ] Revoke OAuth Client Secret: `6394f6afe8fc0a1fbd309...`
  - [ ] Revoke Fine-Grained PAT: `github_pat_11BMTIAHQ0s...` (REDACTED)
  - [ ] Generate new credentials with minimal required scopes

- [ ] **AWS**
  - [ ] Revoke Access Key: `AKIAVIOZFOFOXQ265PWX`
  - [ ] Revoke Secret Access Key (REDACTED)
  - [ ] Revoke Amplify credentials
  - [ ] Check CloudTrail logs for unauthorized access
  - [ ] Generate new credentials with minimal IAM permissions

- [ ] **Notion**
  - [ ] Revoke Integration Secret: `ntn_t77153665567...` (REDACTED)
  - [ ] Revoke hardcoded token: `ntn_558340413361...` (REDACTED)
  - [ ] Generate new integration token
  - [ ] Audit workspace access logs

- [ ] **LinkedIn**
  - [ ] Revoke Client Secret (REDACTED)
  - [ ] Revoke Profile PAT (REDACTED)
  - [ ] Generate new credentials

- [ ] **Firebase**
  - [ ] Review database access logs
  - [ ] Review security rules
  - [ ] Consider rotating database credentials if possible

#### Step 1.2: Audit Service Logs
- [ ] Check Google Cloud Console logs for unauthorized access
- [ ] Check GitHub audit logs for unusual activity
- [ ] Check AWS CloudTrail for unauthorized API calls
- [ ] Check Notion workspace logs
- [ ] Document any suspicious activity

#### Step 1.3: Remove .env from Git Tracking
```bash
# Remove from git tracking
git rm --cached .env

# Add to .gitignore (already present, verify)
echo ".env" >> .gitignore

# Commit the change
git commit -m "Remove .env from version control [SECURITY]"
```

---

### Phase 2: CODE SECURITY HARDENING (Day 1-2)

**Priority:** 🔴 CRITICAL  
**Timeline:** 4-16 hours  
**Status:** ⏳ PENDING

#### Step 2.1: Remove Hardcoded Secrets from Source Code

**Files to Fix:**
1. `src/sdk/notionClient.js` - Remove hardcoded token
2. `src/sdk/githubClient.js` - Remove placeholder fallback
3. Any other files with hardcoded credentials

**Implementation:**
```javascript
// src/sdk/notionClient.js - BEFORE
const notion = new Client({
  auth: process.env.NOTION_TOKEN || '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'
});

// src/sdk/notionClient.js - AFTER
if (!process.env.NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN environment variable is required');
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});
```

#### Step 2.2: Add Environment Variable Validation

**Create:** `src/utils/validateEnv.js`
```javascript
function validateEnvironment() {
  const required = [
    'NOTION_TOKEN',
    'GITHUB_PAT',
    'FIREBASE_DATABASE_URL',
    'GCP_PROJECT_ID',
    // Add all required variables
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { validateEnvironment };
```

**Update:** `src/index.js`
```javascript
const { validateEnvironment } = require('./utils/validateEnv');

// Validate environment before starting server
validateEnvironment();

const app = express();
// ... rest of the code
```

#### Step 2.3: Implement Secrets Management

**Option A: Use Google Secret Manager (Recommended for Cloud Run)**
- Store all secrets in Google Secret Manager
- Update code to fetch secrets from Secret Manager
- Configure Cloud Run to access Secret Manager

**Option B: Use Environment Variables Only**
- Ensure .env is never committed
- Use Cloud Run environment variables
- Document setup process

---

### Phase 3: API AUTHENTICATION & SECURITY (Day 3-5)

**Priority:** 🔴 HIGH  
**Timeline:** 16-40 hours  
**Status:** ⏳ PENDING

#### Step 3.1: Implement API Key Authentication

**Create:** `src/middleware/auth.js`
```javascript
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key against database or environment variable
  const validKeys = (process.env.VALID_API_KEYS || '').split(',');
  
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

module.exports = { validateApiKey };
```

**Update:** `src/routes/loader.js`
```javascript
const { validateApiKey } = require('../middleware/auth');

// Apply to all routes
router.use(validateApiKey);
```

#### Step 3.2: Implement Rate Limiting

**Install:** `express-rate-limit`
```bash
npm install express-rate-limit
```

**Create:** `src/middleware/rateLimiter.js`
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each API key to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
```

#### Step 3.3: Add Input Validation and Sanitization

**Install:** `express-validator`
```bash
npm install express-validator
```

**Implement validation for all endpoints**

#### Step 3.4: Add CORS Configuration

**Install:** `cors`
```bash
npm install cors
```

**Configure CORS properly**

---

### Phase 4: TESTING & QUALITY ASSURANCE (Week 2)

**Priority:** 🟡 MEDIUM  
**Timeline:** 40-80 hours  
**Status:** ⏳ PENDING

#### Step 4.1: Add Security Tests
- [ ] Test API authentication
- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Test CORS configuration

#### Step 4.2: Add Integration Tests
- [ ] Test GitHub routes
- [ ] Test Notion routes
- [ ] Test Firebase routes
- [ ] Test error handling

#### Step 4.3: Add Unit Tests
- [ ] Test middleware functions
- [ ] Test utility functions
- [ ] Test SDK clients

---

### Phase 5: DOCUMENTATION & DEPLOYMENT (Week 3)

**Priority:** 🟡 MEDIUM  
**Timeline:** 20-40 hours  
**Status:** ⏳ PENDING

#### Step 5.1: Update Documentation
- [ ] Document API authentication setup
- [ ] Document environment variable requirements
- [ ] Document security best practices
- [ ] Update README with security notices

#### Step 5.2: Deploy with New Credentials
- [ ] Update Cloud Run environment variables
- [ ] Test deployment with new credentials
- [ ] Verify all endpoints work correctly
- [ ] Monitor logs for errors

#### Step 5.3: Security Audit
- [ ] Run security scanner (npm audit, Snyk, etc.)
- [ ] Review all dependencies for vulnerabilities
- [ ] Implement security headers
- [ ] Add security monitoring

---

## 📊 PROGRESS TRACKING

### Security Issues Status

| Issue | Severity | Status | ETA |
|-------|----------|--------|-----|
| Exposed .env in git | 🔴 CRITICAL | ⏳ PENDING | Day 1 |
| Hardcoded Notion token | 🔴 HIGH | ⏳ PENDING | Day 1 |
| No API authentication | 🟡 MEDIUM | ⏳ PENDING | Day 3-5 |
| Placeholder GitHub token | 🟡 MEDIUM | ⏳ PENDING | Day 2 |
| No rate limiting | 🟡 MEDIUM | ⏳ PENDING | Day 3-5 |
| No input validation | 🟡 MEDIUM | ⏳ PENDING | Day 3-5 |

---

## 🎯 SUCCESS CRITERIA

### Phase 1 (Emergency Response) - Complete When:
- [x] All exposed credentials have been revoked
- [x] All services have been audited for unauthorized access
- [x] .env removed from git tracking
- [x] New credentials generated and securely stored

### Phase 2 (Code Hardening) - Complete When:
- [ ] No hardcoded secrets in source code
- [ ] Environment validation on startup
- [ ] Secrets management implemented
- [ ] All security tests pass

### Phase 3 (API Security) - Complete When:
- [ ] API key authentication implemented
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Security headers implemented

### Phase 4 (Testing) - Complete When:
- [ ] Security tests written and passing
- [ ] Integration tests covering all routes
- [ ] Unit tests for critical functions
- [ ] Test coverage >80%

### Phase 5 (Documentation & Deployment) - Complete When:
- [ ] Documentation updated
- [ ] Deployed with new credentials
- [ ] All endpoints verified working
- [ ] Security monitoring in place
- [ ] No critical vulnerabilities remaining

---

## 📞 INCIDENT RESPONSE

### If Breach is Detected:
1. **Immediate:** Revoke all credentials
2. **Within 1 hour:** Notify all affected parties
3. **Within 4 hours:** Assess scope of breach
4. **Within 24 hours:** Implement fixes
5. **Within 48 hours:** Post-mortem and prevention plan

### Monitoring:
- Set up alerts for unusual API usage
- Monitor Cloud Run logs
- Track API error rates
- Set up uptime monitoring

---

## 🔐 SECURITY BEST PRACTICES GOING FORWARD

1. **Never commit secrets to version control**
2. **Use environment variables for all credentials**
3. **Implement proper authentication and authorization**
4. **Keep dependencies updated**
5. **Run security audits regularly**
6. **Use principle of least privilege for all service accounts**
7. **Implement logging and monitoring**
8. **Regular security reviews**

---

**Last Updated:** January 2, 2026  
**Status:** 🔴 CRITICAL - IMMEDIATE ACTION REQUIRED  
**Next Review:** After Phase 1 completion
