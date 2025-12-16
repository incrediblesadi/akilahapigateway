# Akila API Gateway - Detailed Action Plan

**Project Revival & Redeployment Strategy**  
**Version:** 1.0  
**Date:** December 16, 2025  
**Status:** Ready for Execution

---

## Overview

This document provides a **step-by-step action plan** for redeploying the Akila API Gateway project to production-ready status and launching it to market. Each step follows a **3-part review process** as requested:

1. **Planning** - Define objectives, requirements, and approach
2. **Execution** - Implement the changes with validation
3. **Verification** - Test, document, and confirm success

---

## PHASE 1: Critical Security Hardening

**Timeline:** Week 1 (40 hours)  
**Priority:** 🔴 CRITICAL  
**Dependencies:** None  
**Team Required:** 1 Backend Engineer

---

### Step 1.1: Remove Hardcoded Secrets

#### Part 1: Planning
**Objective:** Eliminate all hardcoded tokens and credentials from source code

**Current Issues Identified:**
- `src/sdk/notionClient.js` - Line 4: Hardcoded Notion token
- `src/sdk/githubClient.js` - Line 4: Placeholder token in fallback
- `src/GitHubRoutes/*.js` - Multiple files: Placeholder tokens

**Approach:**
1. Audit all source files for hardcoded credentials
2. Replace with environment variable references
3. Rotate compromised credentials
4. Update deployment configuration

**Success Criteria:**
- Zero hardcoded secrets in source code
- All credentials sourced from environment variables
- Git history cleaned (if secrets were committed)

#### Part 2: Execution

**Tasks:**
```bash
# 1. Search for all potential secrets
grep -r "ntn_" src/
grep -r "github_pat" src/
grep -r "secret" src/ | grep -v "SECRET"
grep -r "token" src/ | grep -v "TOKEN"
grep -r "key" src/ | grep -v "KEY"

# 2. Edit files to use environment variables
# Example: src/sdk/notionClient.js
# Before: auth: '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'
# After:  auth: process.env.NOTION_TOKEN

# 3. Update .env.example with all required variables
# 4. Rotate all exposed credentials immediately
```

**Code Changes Required:**
- [ ] `src/sdk/notionClient.js` - Remove hardcoded token
- [ ] `src/sdk/githubClient.js` - Ensure fallback is generic
- [ ] `src/GitHubRoutes/*.js` (10 files) - Remove placeholder tokens
- [ ] `.env.example` - Add all required variables
- [ ] `README.md` - Add security notice about credentials

**Time Estimate:** 4 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Run locally with `.env` file - all routes work
- [ ] Deploy to staging - verify environment variables load
- [ ] Test all GitHub routes - authenticated requests succeed
- [ ] Test all Notion routes - API calls work correctly
- [ ] Test Firebase routes - database writes succeed
- [ ] Run security scanner (e.g., `git-secrets`, `trufflehog`)
- [ ] Confirm no secrets in git history (`git log -p | grep -i "secret"`)

**Documentation:**
- [ ] Update README with environment variable setup instructions
- [ ] Document credential rotation procedure
- [ ] Create security best practices guide

**Time Estimate:** 4 hours

---

### Step 1.2: Implement API Key Authentication

#### Part 1: Planning

**Objective:** Protect API endpoints with API key-based authentication

**Requirements:**
- Generate unique API keys for users
- Validate API keys on all routes (except health check)
- Store API keys securely (hashed)
- Provide API key management endpoints

**Approach:**
1. Create API key generation utility
2. Implement authentication middleware
3. Add API key storage (Firebase Realtime DB)
4. Protect all routes except `/` health check

**Success Criteria:**
- Unauthorized requests return 401
- Valid API key allows access
- API keys are hashed in storage
- Rate limiting per API key

**Design:**
```javascript
// Middleware flow
Request → Extract API Key from Header → Hash & Validate → Allow/Deny → Route Handler
```

#### Part 2: Execution

**Tasks:**

**1. Create API Key Generator** (2 hours)
```javascript
// src/middleware/apiKeyGenerator.js
const crypto = require('crypto');

function generateApiKey() {
  return 'ak_' + crypto.randomBytes(32).toString('hex');
}

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

module.exports = { generateApiKey, hashApiKey };
```

**2. Create Authentication Middleware** (4 hours)
```javascript
// src/middleware/authenticate.js
const { hashApiKey } = require('./apiKeyGenerator');
const db = require('../firebase');

async function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const hashedKey = hashApiKey(apiKey);
  const keySnapshot = await db.ref(`api_keys/${hashedKey}`).once('value');
  
  if (!keySnapshot.exists()) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  const keyData = keySnapshot.val();
  
  if (keyData.revoked) {
    return res.status(401).json({ error: 'API key revoked' });
  }
  
  // Attach user info to request
  req.user = {
    id: keyData.userId,
    tier: keyData.tier || 'free'
  };
  
  next();
}

module.exports = authenticate;
```

**3. Apply Middleware to Routes** (2 hours)
```javascript
// src/index.js
const authenticate = require('./middleware/authenticate');

// Public routes (no auth required)
app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Protected routes
app.use('/github', authenticate, githubRoutes);
app.use('/notion', authenticate, notionRoutes);
app.use('/firebase', authenticate, firebaseRoutes);
```

**4. Create API Key Management Endpoints** (4 hours)
```javascript
// src/routes/apiKeys.js
const express = require('express');
const { generateApiKey, hashApiKey } = require('../middleware/apiKeyGenerator');
const db = require('../firebase');

const router = express.Router();

// Generate new API key (temporary - will need proper user auth later)
router.post('/keys/generate', async (req, res) => {
  const { userId, tier } = req.body;
  
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  
  await db.ref(`api_keys/${hashedKey}`).set({
    userId: userId || 'anonymous',
    tier: tier || 'free',
    created: new Date().toISOString(),
    revoked: false
  });
  
  // Return API key ONCE (never stored in plain text)
  res.json({ apiKey, note: 'Save this key - it will not be shown again' });
});

// Revoke API key
router.delete('/keys/revoke', authenticate, async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const hashedKey = hashApiKey(apiKey);
  
  await db.ref(`api_keys/${hashedKey}/revoked`).set(true);
  
  res.json({ status: 'revoked' });
});

module.exports = router;
```

**Time Estimate:** 12 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Request without API key → 401 Unauthorized
- [ ] Request with invalid API key → 401 Unauthorized
- [ ] Request with valid API key → 200 OK
- [ ] Revoked API key → 401 Unauthorized
- [ ] Health check route works without API key
- [ ] All GitHub routes require API key
- [ ] All Notion routes require API key
- [ ] All Firebase routes require API key

**Security Testing:**
- [ ] API keys are never logged in plain text
- [ ] Database stores only hashed keys
- [ ] Cannot retrieve original API key from database
- [ ] Rate limiting applies per API key (next step)

**Documentation:**
- [ ] Update API documentation with authentication requirements
- [ ] Add example curl commands with API key header
- [ ] Document API key generation and revocation process

**Time Estimate:** 4 hours

---

### Step 1.3: Add Rate Limiting

#### Part 1: Planning

**Objective:** Prevent API abuse and control costs

**Requirements:**
- Limit requests per API key per hour
- Different limits for different tiers (free, starter, pro, enterprise)
- Return helpful error messages with retry-after header
- Track usage for billing

**Tier Limits:**
| Tier | Requests/Hour | Requests/Day |
|------|--------------|--------------|
| Free | 100 | 1,000 |
| Starter | 500 | 10,000 |
| Pro | 5,000 | 100,000 |
| Enterprise | Unlimited | Unlimited |

**Approach:**
1. Install rate limiting library (`express-rate-limit`)
2. Create custom rate limiter with API key awareness
3. Store rate limit counters in Redis (or Firebase for MVP)
4. Return 429 Too Many Requests with retry-after

**Success Criteria:**
- Rate limits enforced per API key
- Tier-based limits working correctly
- Helpful error messages returned
- Usage tracking for analytics

#### Part 2: Execution

**Tasks:**

**1. Install Dependencies** (15 minutes)
```bash
npm install express-rate-limit rate-limit-redis ioredis
# OR for MVP without Redis:
# Use Firebase Realtime DB for rate limit storage
```

**2. Create Rate Limiter Middleware** (4 hours)
```javascript
// src/middleware/rateLimiter.js
const db = require('../firebase');

const TIER_LIMITS = {
  free: { hourly: 100, daily: 1000 },
  starter: { hourly: 500, daily: 10000 },
  pro: { hourly: 5000, daily: 100000 },
  enterprise: { hourly: null, daily: null } // unlimited
};

async function rateLimiter(req, res, next) {
  const userId = req.user.id;
  const tier = req.user.tier;
  
  if (tier === 'enterprise') {
    return next(); // No limits for enterprise
  }
  
  const now = new Date();
  const hourKey = `${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const dayKey = `${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  
  const hourlySnapshot = await db.ref(`rate_limits/hourly/${hourKey}`).once('value');
  const dailySnapshot = await db.ref(`rate_limits/daily/${dayKey}`).once('value');
  
  const hourlyCount = hourlySnapshot.val() || 0;
  const dailyCount = dailySnapshot.val() || 0;
  
  const limits = TIER_LIMITS[tier];
  
  if (hourlyCount >= limits.hourly) {
    return res.status(429).json({
      error: 'Hourly rate limit exceeded',
      limit: limits.hourly,
      retryAfter: 3600 - (now.getMinutes() * 60 + now.getSeconds())
    });
  }
  
  if (dailyCount >= limits.daily) {
    return res.status(429).json({
      error: 'Daily rate limit exceeded',
      limit: limits.daily,
      retryAfter: 86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds())
    });
  }
  
  // Increment counters
  await db.ref(`rate_limits/hourly/${hourKey}`).set(hourlyCount + 1);
  await db.ref(`rate_limits/daily/${dayKey}`).set(dailyCount + 1);
  
  // Add usage headers
  res.setHeader('X-RateLimit-Limit', limits.hourly);
  res.setHeader('X-RateLimit-Remaining', limits.hourly - hourlyCount - 1);
  
  next();
}

module.exports = rateLimiter;
```

**3. Apply Rate Limiter** (1 hour)
```javascript
// src/index.js
const rateLimiter = require('./middleware/rateLimiter');

// Apply after authentication
app.use('/github', authenticate, rateLimiter, githubRoutes);
app.use('/notion', authenticate, rateLimiter, notionRoutes);
app.use('/firebase', authenticate, rateLimiter, firebaseRoutes);
```

**4. Create Usage Analytics Endpoint** (3 hours)
```javascript
// src/routes/usage.js
router.get('/usage', authenticate, async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const hourKey = `${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const dayKey = `${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  
  const hourlySnapshot = await db.ref(`rate_limits/hourly/${hourKey}`).once('value');
  const dailySnapshot = await db.ref(`rate_limits/daily/${dayKey}`).once('value');
  
  const limits = TIER_LIMITS[req.user.tier];
  
  res.json({
    tier: req.user.tier,
    hourly: {
      used: hourlySnapshot.val() || 0,
      limit: limits.hourly,
      remaining: limits.hourly - (hourlySnapshot.val() || 0)
    },
    daily: {
      used: dailySnapshot.val() || 0,
      limit: limits.daily,
      remaining: limits.daily - (dailySnapshot.val() || 0)
    }
  });
});
```

**Time Estimate:** 8 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Free tier: 101st request in hour → 429 error
- [ ] Starter tier: 501st request in hour → 429 error
- [ ] Pro tier: 5,001st request in hour → 429 error
- [ ] Enterprise tier: Unlimited requests work
- [ ] Daily limits enforced correctly
- [ ] Retry-after header present in 429 responses
- [ ] Rate limit headers present in successful responses
- [ ] Usage endpoint returns accurate counts

**Load Testing:**
```bash
# Test rate limiting with Apache Bench
ab -n 150 -c 10 -H "x-api-key: your_free_tier_key" \
  https://your-api.run.app/github/repos

# Expected: First 100 succeed, next 50 get 429
```

**Documentation:**
- [ ] Document rate limits per tier
- [ ] Add rate limit headers to API docs
- [ ] Explain 429 error handling
- [ ] Document usage analytics endpoint

**Time Estimate:** 4 hours

---

### Step 1.4: Set Up Monitoring & Alerts

#### Part 1: Planning

**Objective:** Detect and respond to production issues quickly

**Requirements:**
- Error tracking and logging
- Uptime monitoring
- Performance metrics
- Alerting for critical issues

**Tools to Integrate:**
- Google Cloud Logging (already available)
- Cloud Monitoring (already available)
- Optional: Sentry for error tracking
- Optional: Better Uptime for external monitoring

**Alerts Needed:**
- API error rate > 5%
- Average response time > 2 seconds
- Service downtime
- Rate limit abuse (same IP hitting limits repeatedly)

**Success Criteria:**
- All errors logged and tracked
- Alerts fire within 5 minutes of issue
- Dashboard shows key metrics
- On-call rotation can respond to alerts

#### Part 2: Execution

**Tasks:**

**1. Set Up Structured Logging** (3 hours)
```javascript
// src/middleware/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      apiKey: req.headers['x-api-key']?.substring(0, 10) + '...'
    });
  });
  
  next();
}

module.exports = { logger, requestLogger };
```

**2. Add Error Tracking** (2 hours)
```javascript
// src/middleware/errorHandler.js
const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });
  
  // Don't expose internal errors to clients
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id // for support debugging
  });
}

module.exports = errorHandler;
```

**3. Configure Cloud Monitoring** (4 hours)
```yaml
# monitoring-policy.yaml
alertPolicy:
  displayName: "High Error Rate"
  conditions:
    - displayName: "Error rate > 5%"
      conditionThreshold:
        filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'
        comparison: COMPARISON_GT
        thresholdValue: 0.05
        duration: 300s
  notificationChannels:
    - projects/akilahstack/notificationChannels/email
```

**4. Create Health Check Endpoint** (1 hour)
```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firebase: 'unknown',
      github: 'unknown',
      notion: 'unknown'
    }
  };
  
  // Test Firebase
  try {
    await db.ref('health_check').set({ timestamp: Date.now() });
    health.services.firebase = 'healthy';
  } catch (err) {
    health.services.firebase = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Test GitHub (simple API call)
  try {
    await octokit.users.getAuthenticated();
    health.services.github = 'healthy';
  } catch (err) {
    health.services.github = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Test Notion (simple API call)
  try {
    await notion.users.me();
    health.services.notion = 'healthy';
  } catch (err) {
    health.services.notion = 'unhealthy';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

**Time Estimate:** 10 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Errors logged to Cloud Logging
- [ ] Structured logs contain all required fields
- [ ] Health check endpoint returns service status
- [ ] Alert fires when error rate exceeds threshold (simulate errors)
- [ ] Alert fires when service is down (stop service)
- [ ] Dashboard shows request rate, error rate, latency
- [ ] Logs are searchable and filterable

**Monitoring Dashboard:**
- [ ] Request rate (requests/minute)
- [ ] Error rate (% of requests)
- [ ] P50, P95, P99 latency
- [ ] Active users count
- [ ] API key usage by tier

**Documentation:**
- [ ] Document how to access logs
- [ ] Document how to respond to alerts
- [ ] Create runbook for common issues
- [ ] Document escalation procedures

**Time Estimate:** 2 hours

---

## PHASE 2: Testing & Quality Assurance

**Timeline:** Week 2-3 (48 hours)  
**Priority:** 🟡 HIGH  
**Dependencies:** Phase 1 complete  
**Team Required:** 1 Backend Engineer + 1 QA Engineer (or same engineer)

---

### Step 2.1: Write Unit Tests

#### Part 1: Planning

**Objective:** Achieve 80%+ code coverage with unit tests

**Current State:** ~5% coverage (only backend directory structure test)

**Testing Strategy:**
- Use Jest (already in package.json)
- Test all route handlers
- Test middleware (authentication, rate limiting)
- Test utility functions (API key generation, encryption)
- Mock external API calls (GitHub, Notion, Firebase)

**Success Criteria:**
- 80%+ code coverage
- All critical paths tested
- Tests run in <30 seconds
- Tests pass consistently

#### Part 2: Execution

**Tasks:**

**1. Set Up Test Environment** (2 hours)
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['./test/setup.js']
};
```

**2. Write Tests for GitHub Routes** (10 hours)
```javascript
// src/GitHubRoutes/__tests__/repos.test.js
const request = require('supertest');
const app = require('../../index');
const { Octokit } = require('@octokit/rest');

jest.mock('@octokit/rest');

describe('GitHub Repos API', () => {
  let apiKey;
  
  beforeAll(async () => {
    // Generate test API key
    const res = await request(app)
      .post('/keys/generate')
      .send({ userId: 'test-user', tier: 'pro' });
    apiKey = res.body.apiKey;
  });
  
  describe('GET /repos', () => {
    it('should return list of repositories', async () => {
      const mockRepos = [
        { name: 'repo1', owner: { login: 'user1' }, private: false },
        { name: 'repo2', owner: { login: 'user1' }, private: true }
      ];
      
      Octokit.prototype.repos = {
        listForAuthenticatedUser: jest.fn().mockResolvedValue({ data: mockRepos })
      };
      
      const res = await request(app)
        .get('/repos')
        .set('x-api-key', apiKey);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('repo1');
    });
    
    it('should return 401 without API key', async () => {
      const res = await request(app).get('/repos');
      expect(res.status).toBe(401);
    });
  });
  
  // More tests...
});
```

**3. Write Tests for Notion Routes** (8 hours)
**4. Write Tests for Firebase Routes** (4 hours)
**5. Write Tests for Middleware** (6 hours)
```javascript
// src/middleware/__tests__/authenticate.test.js
describe('Authentication Middleware', () => {
  it('should reject requests without API key', async () => {
    const res = await request(app).get('/github/repos');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('API key required');
  });
  
  it('should reject invalid API keys', async () => {
    const res = await request(app)
      .get('/github/repos')
      .set('x-api-key', 'invalid_key');
    expect(res.status).toBe(401);
  });
  
  it('should accept valid API keys', async () => {
    // Test implementation
  });
});
```

**Time Estimate:** 30 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm test -- --coverage` - 80%+ coverage achieved
- [ ] Tests complete in <30 seconds
- [ ] No flaky tests (run 10 times, all pass)
- [ ] Tests can run in parallel
- [ ] Tests clean up after themselves (no side effects)

**Coverage Report Review:**
- [ ] All route handlers covered
- [ ] All middleware covered
- [ ] All utility functions covered
- [ ] Error paths tested
- [ ] Edge cases tested

**Documentation:**
- [ ] README updated with testing instructions
- [ ] Contributing guide includes testing requirements
- [ ] CI/CD configured to run tests on every PR

**Time Estimate:** 2 hours

---

### Step 2.2: Create Integration Tests

#### Part 1: Planning

**Objective:** Test end-to-end workflows with real external service calls

**Scope:**
- Test actual GitHub API integration (use test repository)
- Test actual Notion API integration (use test workspace)
- Test actual Firebase integration (use test database)
- Test multi-step workflows

**Approach:**
- Use separate test environment
- Use real API credentials (test accounts)
- Clean up test data after each run
- Run integration tests separately from unit tests

**Success Criteria:**
- All critical workflows tested end-to-end
- Tests use real external services
- Tests clean up after themselves
- Tests documented and runnable by anyone

#### Part 2: Execution

**Tasks:**

**1. Set Up Integration Test Environment** (3 hours)
```javascript
// test/integration/setup.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

// Test environment variables
process.env.GITHUB_PAT = process.env.TEST_GITHUB_PAT;
process.env.NOTION_TOKEN = process.env.TEST_NOTION_TOKEN;
process.env.FIREBASE_DATABASE_URL = process.env.TEST_FIREBASE_URL;
```

**2. Write GitHub Integration Tests** (5 hours)
```javascript
// test/integration/github.integration.test.js
describe('GitHub Integration', () => {
  const testRepoName = `test-repo-${Date.now()}`;
  
  it('should create, update file, and delete repository', async () => {
    // 1. Create test repository
    const createRes = await request(app)
      .post('/repos/create')
      .set('x-api-key', apiKey)
      .send({
        name: testRepoName,
        description: 'Integration test repo',
        private: true
      });
    
    expect(createRes.status).toBe(200);
    expect(createRes.body.status).toBe('created');
    
    // 2. Write file to repository
    const writeRes = await request(app)
      .put(`/files/test-user/${testRepoName}/README.md`)
      .set('x-api-key', apiKey)
      .send({
        content: '# Test Repository',
        message: 'Initial commit'
      });
    
    expect(writeRes.status).toBe(200);
    
    // 3. Read file back
    const readRes = await request(app)
      .get(`/files/test-user/${testRepoName}/README.md`)
      .set('x-api-key', apiKey);
    
    expect(readRes.status).toBe(200);
    expect(readRes.body.content).toContain('# Test Repository');
    
    // 4. Cleanup: Delete repository (use GitHub API directly)
    // await octokit.repos.delete({ owner: 'test-user', repo: testRepoName });
  });
});
```

**3. Write Notion Integration Tests** (4 hours)
**4. Write Firebase Integration Tests** (3 hours)
**5. Write Multi-Service Workflow Tests** (3 hours)

**Time Estimate:** 18 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Run `npm run test:integration` - all tests pass
- [ ] Tests use real external services
- [ ] Test data is cleaned up after each run
- [ ] Tests can run in any order
- [ ] Tests handle rate limiting gracefully
- [ ] Tests include assertions on response times

**Manual Testing:**
- [ ] Run full integration test suite 3 times
- [ ] Verify no test data left in external services
- [ ] Check for any flaky tests
- [ ] Verify tests work on clean environment (new developer setup)

**Documentation:**
- [ ] Integration test README with setup instructions
- [ ] Document test account creation process
- [ ] Document how to add new integration tests

**Time Estimate:** 2 hours

---

## PHASE 3: Documentation & Developer Experience

**Timeline:** Week 3-4 (40 hours)  
**Priority:** 🟡 HIGH  
**Dependencies:** Phases 1-2 complete  
**Team Required:** 1 Technical Writer or Developer

---

### Step 3.1: Generate OpenAPI/Swagger Documentation

#### Part 1: Planning

**Objective:** Create industry-standard API documentation

**Tool:** `swagger-jsdoc` + `swagger-ui-express`

**Approach:**
1. Add JSDoc comments to all route handlers
2. Generate OpenAPI 3.0 spec
3. Serve Swagger UI at `/api-docs`
4. Include authentication, request/response examples

**Success Criteria:**
- Complete API reference at `/api-docs`
- All endpoints documented
- Request/response examples included
- Authentication documented
- Exportable OpenAPI spec

#### Part 2: Execution

**Tasks:**

**1. Install Dependencies** (15 minutes)
```bash
npm install swagger-jsdoc swagger-ui-express
```

**2. Add JSDoc Comments to Routes** (16 hours)
```javascript
// src/GitHubRoutes/repos.js
/**
 * @swagger
 * /repos:
 *   get:
 *     summary: List all accessible repositories
 *     tags: [GitHub]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of repositories per page
 *     responses:
 *       200:
 *         description: List of repositories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   owner:
 *                     type: string
 *                   private:
 *                     type: boolean
 *                   description:
 *                     type: string
 *             example:
 *               - name: "my-repo"
 *                 owner: "username"
 *                 private: false
 *                 description: "My awesome repository"
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/repos', async (req, res) => {
  // Implementation...
});
```

**3. Configure Swagger** (2 hours)
```javascript
// src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Akila API Gateway',
      version: '1.0.0',
      description: 'Unified API for GitHub, Notion, and Firebase',
      contact: {
        name: 'API Support',
        email: 'support@akilaapi.com'
      }
    },
    servers: [
      {
        url: 'https://akilahapigateway-858627689875.us-central1.run.app',
        description: 'Production server'
      },
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    }
  },
  apis: ['./src/**/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
```

**4. Serve Swagger UI** (1 hour)
```javascript
// src/index.js
const { specs, swaggerUi } = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**Time Estimate:** 19 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Visit `/api-docs` - Swagger UI loads
- [ ] All endpoints documented
- [ ] Try out API calls from Swagger UI (with API key)
- [ ] Request/response examples are accurate
- [ ] Authentication is documented
- [ ] Rate limiting is documented
- [ ] Error responses documented

**Quality Check:**
- [ ] All parameters documented
- [ ] All response codes documented
- [ ] Example requests include all required fields
- [ ] Example responses match actual API responses

**Documentation:**
- [ ] Add link to API docs in README
- [ ] Include screenshot of Swagger UI

**Time Estimate:** 1 hour

---

### Step 3.2: Write Developer Getting Started Guide

#### Part 1: Planning

**Objective:** Enable new developers to integrate within 15 minutes

**Contents:**
1. Quick start (5-minute integration)
2. Authentication setup
3. Making your first API call
4. Common use cases with code examples
5. Error handling
6. Best practices

**Success Criteria:**
- Complete guide in README
- Code examples for all major languages (JavaScript, Python, cURL)
- Links to API reference
- Troubleshooting section

#### Part 2: Execution

**Tasks:**

**1. Write Quick Start** (3 hours)
```markdown
# Quick Start

Get started with Akila API Gateway in 5 minutes.

## 1. Get an API Key

```bash
curl -X POST https://akilaapi.run.app/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-email@example.com", "tier": "free"}'
```

Save the returned API key - you'll need it for all requests.

## 2. Make Your First Request

```bash
curl https://akilaapi.run.app/github/repos \
  -H "x-api-key: your_api_key_here"
```

## 3. Try It in Code

**JavaScript:**
```javascript
const apiKey = 'your_api_key_here';

const response = await fetch('https://akilaapi.run.app/github/repos', {
  headers: { 'x-api-key': apiKey }
});

const repos = await response.json();
console.log(repos);
```

**Python:**
```python
import requests

api_key = 'your_api_key_here'
headers = {'x-api-key': api_key}

response = requests.get('https://akilaapi.run.app/github/repos', headers=headers)
repos = response.json()
print(repos)
```

That's it! You're ready to start building.

## Next Steps

- [View Full API Reference](/api-docs)
- [See Example Use Cases](#examples)
- [Join Developer Community](https://discord.gg/akilaapi)
```

**2. Write Example Use Cases** (4 hours)
- Example: Automate GitHub issue creation from Notion
- Example: Log deployment events to Firebase
- Example: Sync GitHub workflow status to Notion database
- Example: Manage GitHub secrets programmatically

**3. Write Troubleshooting Guide** (2 hours)
- Common errors and solutions
- Rate limiting explained
- Authentication issues
- API connectivity problems

**Time Estimate:** 9 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Follow quick start guide from scratch - complete in <15 mins
- [ ] All code examples run without errors
- [ ] Links to API docs work
- [ ] Examples cover common use cases
- [ ] Troubleshooting guide addresses actual issues

**User Testing:**
- [ ] Have 3 developers follow the guide independently
- [ ] Collect feedback on clarity and completeness
- [ ] Update based on feedback

**Documentation:**
- [ ] README is well-formatted and readable
- [ ] Code examples are syntax-highlighted
- [ ] Screenshots/GIFs included where helpful

**Time Estimate:** 2 hours

---

## PHASE 4: Go-to-Market Preparation

**Timeline:** Week 5-6 (48 hours)  
**Priority:** 🟢 MEDIUM  
**Dependencies:** Phases 1-3 complete  
**Team Required:** 1 Full-stack Developer + 1 Designer/Marketer

---

### Step 4.1: Build Landing Page

#### Part 1: Planning

**Objective:** Create professional landing page that converts visitors to users

**Key Sections:**
1. Hero section with value proposition
2. Feature highlights
3. Pricing table
4. Code examples/demo
5. Testimonials (from beta users)
6. FAQ
7. Call-to-action (Get API Key)

**Design Requirements:**
- Mobile-responsive
- Fast loading (<2 seconds)
- Clear call-to-action
- Professional design
- SEO optimized

**Success Criteria:**
- Landing page live at custom domain
- 10%+ visitor-to-signup conversion rate
- Page loads in <2 seconds
- Mobile-friendly (responsive design)

#### Part 2: Execution

**Tasks:**

**1. Choose Tech Stack** (1 hour)
- Option A: Next.js + Tailwind CSS (recommended)
- Option B: Simple HTML/CSS/JavaScript
- Option C: No-code tool (Webflow, Framer)

**2. Design Landing Page** (8 hours)
**3. Implement Landing Page** (10 hours)
**4. Integrate with API (signup form)** (4 hours)
**5. Deploy to Custom Domain** (2 hours)

**Time Estimate:** 25 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] Landing page loads in <2 seconds
- [ ] Mobile responsive (test on iOS and Android)
- [ ] Signup form works and generates API key
- [ ] All links work
- [ ] SEO meta tags present
- [ ] Analytics tracking configured

**A/B Testing:**
- [ ] Test different hero copy
- [ ] Test different CTAs
- [ ] Monitor conversion rates

**Documentation:**
- [ ] Update README with landing page URL
- [ ] Document deployment process

**Time Estimate:** 3 hours

---

### Step 4.2: Create Developer Portal

#### Part 1: Planning

**Objective:** Self-service dashboard for API key management and usage analytics

**Features:**
1. API key generation and revocation
2. Usage analytics (requests per day/hour)
3. Tier management (upgrade/downgrade)
4. Billing integration (Stripe)
5. API documentation link

**Tech Stack:** Next.js + Firebase Auth

**Success Criteria:**
- Users can manage API keys themselves
- Real-time usage analytics
- Upgrade to paid tiers works
- Billing integrated

#### Part 2: Execution

**Tasks:**

**1. Set Up Next.js Project** (2 hours)
**2. Implement Firebase Authentication** (4 hours)
**3. Build API Key Management UI** (6 hours)
**4. Build Usage Analytics Dashboard** (6 hours)
**5. Integrate Stripe for Billing** (6 hours)
**6. Deploy Developer Portal** (2 hours)

**Time Estimate:** 26 hours

#### Part 3: Verification

**Testing Checklist:**
- [ ] User can sign up and log in
- [ ] User can generate API keys
- [ ] User can revoke API keys
- [ ] Usage analytics update in real-time
- [ ] Tier upgrade works and charges correctly
- [ ] Tier downgrade works and prorates refund
- [ ] Email notifications work (signup, billing, etc.)

**User Testing:**
- [ ] Have 5 beta users test the portal
- [ ] Collect feedback
- [ ] Fix usability issues

**Documentation:**
- [ ] User guide for developer portal
- [ ] Billing FAQs

**Time Estimate:** 4 hours

---

## PHASE 5: Beta Launch & User Acquisition

**Timeline:** Week 6-8 (40 hours)  
**Priority:** 🟢 MEDIUM  
**Dependencies:** Phases 1-4 complete  
**Team Required:** 1 Growth/Marketing Person

---

### Step 5.1: Beta Tester Recruitment

#### Part 1: Planning

**Objective:** Recruit 50-100 beta testers to validate product-market fit

**Target Audience:**
- DevOps engineers
- Full-stack developers
- SaaS founders
- Open source maintainers

**Recruitment Channels:**
1. Hacker News (Show HN post)
2. Product Hunt (beta launch)
3. Dev.to article
4. Reddit (r/devops, r/SideProject)
5. Twitter/X
6. Developer Discord communities
7. Email outreach to warm contacts

**Offer:**
- Free lifetime access (grandfathered pricing)
- Direct access to founders
- Influence product roadmap
- Early adopter badge

**Success Criteria:**
- 50+ beta testers signed up
- 20+ active users (making API calls weekly)
- 10+ feedback sessions completed

#### Part 2: Execution

**Tasks:**

**1. Create Beta Landing Page** (4 hours)
```markdown
# Join Akila API Gateway Beta

Be one of the first 100 developers to try the unified API for GitHub, Notion, and Firebase.

**Beta Perks:**
- 🎁 Free lifetime Pro tier ($99/month value)
- 🚀 Direct access to founders
- 🗳️ Influence product roadmap
- 🏆 Early adopter badge

**What We Ask:**
- Use the API in your projects
- Provide honest feedback (weekly check-ins)
- Report bugs and suggest features

[Apply for Beta Access →]
```

**2. Write Launch Posts** (6 hours)

**Hacker News:**
```
Show HN: Akila API Gateway – One API for GitHub, Notion, and Firebase

Hi HN! I built Akila API Gateway to solve a problem I had: managing GitHub repos, Notion docs, and Firebase data required integrating 3 different APIs with different auth patterns and rate limits.

Akila provides a unified REST API with:
- GitHub (repos, issues, workflows, secrets with libsodium encryption)
- Notion (pages, blocks, workspace management)
- Firebase (logging, structured notes)

It's deployed on Cloud Run with auto-scaling and has been running in production for 6 months.

I'm looking for 50-100 beta testers to validate product-market fit. Beta testers get free lifetime Pro tier ($99/month value).

Check it out: [URL]
Feedback welcome!
```

**Product Hunt:**
```
Akila API Gateway - GitHub, Notion & Firebase in one API

Tagline: Stop juggling 3 APIs - manage GitHub, Notion, and Firebase through one unified interface

Description:
Akila API Gateway consolidates GitHub, Notion, and Firebase into a single developer-friendly REST API.

🔥 Key Features:
• 45+ endpoints across GitHub, Notion, Firebase
• Automated secret encryption for GitHub Actions
• Usage-based pricing starting at $0/month
• OpenAPI documentation
• Auto-scaling infrastructure on Google Cloud

Perfect for DevOps teams, SaaS builders, and workflow automation.

🎁 First 100 users get lifetime Pro tier for free!

Built with: Node.js, Express, Docker, Google Cloud Run
```

**3. Create Social Media Campaign** (3 hours)
- Twitter thread explaining the problem and solution
- LinkedIn post targeting DevOps professionals
- Dev.to article with technical deep-dive

**4. Reach Out to Developer Communities** (5 hours)
- Post in relevant Discord servers
- Comment in relevant Reddit threads
- Email developer newsletters for coverage

**Time Estimate:** 18 hours

#### Part 3: Verification

**Metrics to Track:**
- [ ] Beta signups: Target 50-100
- [ ] Activation rate: % who make first API call (target: 60%)
- [ ] Weekly active users: Target 20+
- [ ] NPS score: Target 40+
- [ ] Feature requests collected: Target 50+

**Feedback Collection:**
- [ ] Weekly survey to active users
- [ ] 1-on-1 interviews with 10 power users
- [ ] Bug reports tracked in GitHub Issues
- [ ] Feature requests in public roadmap

**Documentation:**
- [ ] Feedback summary document
- [ ] Prioritized feature roadmap based on feedback

**Time Estimate:** 2 hours setup + ongoing monitoring

---

### Step 5.2: Iterate Based on Feedback

#### Part 1: Planning

**Objective:** Quickly iterate on product based on beta user feedback

**Process:**
1. Collect feedback weekly
2. Prioritize top 3 requests/bugs
3. Fix and deploy within 1 week
4. Communicate updates to beta users

**Success Criteria:**
- Weekly release cadence
- Top bugs fixed within 1 week
- Top feature requests implemented within 1 month
- Beta users feel heard and engaged

#### Part 2: Execution

**Tasks:**

**1. Set Up Feedback Loop** (2 hours)
- Weekly feedback form
- Public roadmap (e.g., on Trello or GitHub Projects)
- Changelog for updates

**2. Prioritize and Implement** (12 hours/week for 4 weeks)
- Review feedback
- Prioritize using RICE framework (Reach, Impact, Confidence, Effort)
- Implement top 3 items
- Deploy to production
- Notify users of updates

**Time Estimate:** 2 + (12 × 4) = 50 hours

#### Part 3: Verification

**Metrics:**
- [ ] Feedback response time: <24 hours
- [ ] Bug fix time: <1 week for critical, <2 weeks for major
- [ ] Feature delivery: 1+ feature per week
- [ ] User satisfaction: NPS increasing month-over-month
- [ ] Churn rate: <5% monthly for beta users

**Engagement:**
- [ ] Send weekly update emails to beta users
- [ ] Host monthly Q&A sessions
- [ ] Create beta user Slack/Discord channel

**Documentation:**
- [ ] Changelog updated weekly
- [ ] Feedback incorporated into roadmap

**Time Estimate:** Ongoing

---

## SUCCESS METRICS & KPIs

### Technical Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Uptime | 99.9% | Cloud Monitoring uptime checks |
| API Response Time (P95) | <500ms | Cloud Monitoring latency metrics |
| Error Rate | <1% | Log analysis, error tracking |
| Test Coverage | 80%+ | Jest coverage report |
| Security Vulnerabilities | 0 critical | Snyk/Dependabot scans |

### User Metrics

| Metric | Week 4 | Week 8 | Week 12 |
|--------|--------|--------|---------|
| Registered Users | 50 | 150 | 500 |
| Active Users (weekly) | 20 | 60 | 200 |
| API Calls/Week | 5,000 | 20,000 | 100,000 |
| NPS Score | 30 | 40 | 50 |

### Business Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Paid Customers | 5 | 20 | 50 |
| Monthly Recurring Revenue | $150 | $1,000 | $3,000 |
| Customer Acquisition Cost | $100 | $75 | $50 |
| Lifetime Value | $600 | $900 | $1,200 |
| Churn Rate | <10% | <5% | <5% |

---

## RISK MITIGATION PLAN

### Technical Risks

**Risk:** GitHub API rate limit exceeded  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Implement caching layer (Redis)
- Queue requests during high load
- Monitor rate limit usage

**Risk:** Security breach (API keys leaked)  
**Likelihood:** Medium  
**Impact:** Critical  
**Mitigation:**
- Implement API key rotation
- Monitor for suspicious activity
- Have incident response plan
- Get cybersecurity insurance

**Risk:** Cloud Run costs spiral out of control  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Set budget alerts in GCP
- Implement strict rate limiting
- Monitor costs daily

### Business Risks

**Risk:** Low user adoption  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Generous free tier to lower barrier
- Content marketing for discovery
- Direct outreach to target users

**Risk:** Competitor launches similar product  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Move fast and iterate
- Build community and brand
- Focus on superior developer experience

---

## CONCLUSION

This detailed action plan provides a comprehensive roadmap for redeploying and launching the Akila API Gateway to production. The plan follows a **3-part review process** for each step (Planning → Execution → Verification) and is designed to be executed over **6-8 weeks** with a small team.

**Key Milestones:**
- ✅ Week 1-2: Critical security and infrastructure
- ✅ Week 3-4: Testing and documentation
- ✅ Week 5-6: Landing page and developer portal
- ✅ Week 7-8: Beta launch and user acquisition

**Total Investment:** $15,000-25,000  
**Expected Outcome:** Production-ready API with 50+ beta users and validation for Series A

**Next Action:** Begin Phase 1, Step 1.1 (Remove Hardcoded Secrets)

---

**Document Maintained By:** Project Technical Lead  
**Last Updated:** December 16, 2025  
**Status:** Ready for execution
