const express = require('express');
const router = express.Router();
const { getGoogleSearchConfig } = require('../sdk');

// Google Custom Search API for job searches
// Requires: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID

const GOOGLE_SEARCH_BASE = 'https://www.googleapis.com/customsearch/v1';

function getGoogleConfigOrError(res) {
  const { apiKey, searchEngineId, configured } = getGoogleSearchConfig();
  if (!configured) {
    res.status(500).json({
      error: 'Google Search API not configured',
      required: ['GOOGLE_SEARCH_API_KEY', 'GOOGLE_SEARCH_ENGINE_ID']
    });
    return null;
  }
  return { apiKey, searchEngineId };
}

// Search for jobs using Google Custom Search
router.get('/jobs', async (req, res) => {
  try {
    const config = getGoogleConfigOrError(res);
    if (!config) return;
    const { apiKey, searchEngineId } = config;

    const { q, location, type, remote, start = 1, num = 10 } = req.query;

    // Build search query for jobs
    let searchQuery = q || 'software developer jobs';
    if (location) searchQuery += ` in ${location}`;
    if (type) searchQuery += ` ${type}`;
    if (remote === 'true') searchQuery += ' remote';

    // Add job sites to search
    searchQuery += ' site:linkedin.com/jobs OR site:indeed.com OR site:glassdoor.com OR site:dice.com';

    const url = new URL(GOOGLE_SEARCH_BASE);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('start', start);
    url.searchParams.append('num', Math.min(num, 10)); // Max 10 per request

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Format results
    const jobs = (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname,
      displayLink: item.displayLink
    }));

    res.json({
      query: searchQuery,
      totalResults: data.searchInformation?.totalResults,
      jobs,
      nextPage: data.queries?.nextPage?.[0]?.startIndex
    });
  } catch (error) {
    console.error('Google job search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// General web search
router.get('/search', async (req, res) => {
  try {
    const config = getGoogleConfigOrError(res);
    if (!config) return;
    const { apiKey, searchEngineId } = config;

    const { q, start = 1, num = 10, site, dateRestrict } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    let searchQuery = q;
    if (site) searchQuery += ` site:${site}`;

    const url = new URL(GOOGLE_SEARCH_BASE);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('start', start);
    url.searchParams.append('num', Math.min(num, 10));
    if (dateRestrict) url.searchParams.append('dateRestrict', dateRestrict);

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    res.json({
      query: q,
      totalResults: data.searchInformation?.totalResults,
      searchTime: data.searchInformation?.searchTime,
      items: data.items || []
    });
  } catch (error) {
    console.error('Google search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search for companies
router.get('/companies', async (req, res) => {
  try {
    const config = getGoogleConfigOrError(res);
    if (!config) return;
    const { apiKey, searchEngineId } = config;

    const { name, location } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    let searchQuery = `${name} company`;
    if (location) searchQuery += ` ${location}`;
    searchQuery += ' site:linkedin.com/company OR site:glassdoor.com/Overview';

    const url = new URL(GOOGLE_SEARCH_BASE);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', 10);

    const response = await fetch(url);
    const data = await response.json();

    const companies = (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname
    }));

    res.json({ query: name, companies });
  } catch (error) {
    console.error('Google company search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  const { configured } = getGoogleSearchConfig();

  res.json({
    configured,
    message: configured
      ? 'Google Search API configured'
      : 'Add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID to .env'
  });
});

module.exports = router;
