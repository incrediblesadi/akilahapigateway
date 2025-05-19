# REPO MAPM

_Last updated: May 16, 2025_

---

## 💉 MANUAL ZONE - DO NOT OVERWRITE

## Challenges
- Secrets must be encrypted with GitHub's public key API.
- Firebase routes must be scoped and protected to void overwrite.
- Notion blocks must be updated with their correct block type.

## Best Practices
- Keep `sdk/` readonly for integration code.
 - Rerun `buildCurrentSession.js` after changing Notion pages.
 - Use proper block comments at the top of each route.js file.

## GPT Tips
- Use `"/notion/get-overview" first to explore page content.
- Append new blocks deliberately. Avoid destructive updates.
 - Follow repo metadata using `/repos`.

---

## 💋 AUTO-GENERATED ZONE - SAFE TO NURATE

### Repo Structure

```
crc
/-- Repo Structure Section would be auto-generated in this area
```

### File Summaries

** index.js - Boots is Express server entry point.
- [routes/loader.js] - Registers Notion, GitHub, and Firebase routes.
 - [clients/notionClient.js] - Sets up the Notion sdkc.
- [githubClient.js] - Exports functions to list repos, branches, issues.