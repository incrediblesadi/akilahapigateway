const express = require('express');
const router = express.Router();
const { getLinkedInConfig } = require('../sdk');

// LinkedIn API Configuration
// Requires: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// Helper function for LinkedIn API calls
async function linkedinFetch(endpoint, options = {}) {
  const { accessToken } = getLinkedInConfig();
  if (!accessToken) {
    throw new Error('LinkedIn access token not configured');
  }

  const response = await fetch(`${LINKEDIN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get current user's profile
router.get('/me', async (req, res) => {
  try {
    const profile = await linkedinFetch('/me?projection=(id,firstName,lastName,profilePicture,headline)');
    res.json(profile);
  } catch (error) {
    console.error('LinkedIn profile error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user's connections count
router.get('/connections', async (req, res) => {
  try {
    const connections = await linkedinFetch('/connections?q=viewer&start=0&count=10');
    res.json(connections);
  } catch (error) {
    console.error('LinkedIn connections error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Share a post on LinkedIn
router.post('/share', async (req, res) => {
  try {
    const { text, visibility = 'PUBLIC' } = req.body;

    // First get the user's URN
    const me = await linkedinFetch('/me');
    const authorUrn = `urn:li:person:${me.id}`;

    const post = await linkedinFetch('/ugcPosts', {
      method: 'POST',
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      })
    });

    res.json({ status: 'posted', post });
  } catch (error) {
    console.error('LinkedIn share error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user's posts
router.get('/posts', async (req, res) => {
  try {
    const me = await linkedinFetch('/me');
    const authorUrn = `urn:li:person:${me.id}`;

    const posts = await linkedinFetch(`/ugcPosts?q=authors&authors=List(${encodeURIComponent(authorUrn)})&count=10`);
    res.json(posts);
  } catch (error) {
    console.error('LinkedIn posts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// OAuth flow - Step 1: Get authorization URL
router.get('/auth/url', (req, res) => {
  const { clientId, redirectUri } = getLinkedInConfig();
  const scope = 'r_liteprofile r_emailaddress w_member_social';
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  res.json({ authUrl, state });
});

// OAuth flow - Step 2: Exchange code for token
router.post('/auth/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    const config = getLinkedInConfig();
    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || config.redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const token = await response.json();
    res.json(token);
  } catch (error) {
    console.error('LinkedIn token error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check for LinkedIn integration
router.get('/health', (req, res) => {
  const { configured, hasToken } = getLinkedInConfig();

  res.json({
    configured,
    hasToken,
    message: configured
      ? (hasToken ? 'LinkedIn fully configured' : 'LinkedIn configured, needs OAuth token')
      : 'LinkedIn not configured - add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env'
  });
});

module.exports = router;
