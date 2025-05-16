const fs = require('fs');
const path = require('path');
const notion = require('../sdk/notionClient');
const { getGitHubData } = require('../sdk/githubClient');
const { getFirebasePaths } = require('../sdk/firebaseClient');
const notionPages = require('../NotionRoutes/notionPages');

async function buildCurrentSession() {
  const timestamp = new Date().toISOString();

  const session = {
    sessionId: `gpt-session-${timestamp.split('T')[0]`,
    timestamp,
    services: {
      notion: { pages: [], selectedPage: null, actions: ["getOverview", "readBlock", "appendToPage", "editRequest", "createPage", "createBlock"] },
      github: { repos: [], selectedRepo: null, actions: ["listRepos", "getIssues", "createPR", "getBranches"] },
      firebase: { paths: [], selectedPath: "/chat", actions: ["readPath", "logMessage", "uploadFile"] }
    },
    navigation: { lastNode: null, lastAction: null, history: [] },
    references: { editableBlocks: [], recentlyAppended: [], createdPages: [] },
    constraints: { allowDeletion: false, requireApprovalForEdits: true, maxAppendPerPage: 5 },
    persistence: { storeTo: 'firebase', archiveAt: null, postActions: ["pushSummaryToNotion", "emailTranscript"] },
    tools: ["push_to_memory", "append_to_notion", "summarize_repo", "log_to_firebase", "create_new_page"],
    annotations: { reminders: [], nextAction: "" }
  };

  // Notion Pages and Blocks
  for (const page of notionPages) {
    const blockResp = await notion.blocks.children.list({ block_id: page.id, page_size: 10 });

    session.services.notion.pages.push({
    id: page.id,
    title: page.label,
    blockTypes: blockResp.results.map(b => b.type),
    blocks: blockResp.results.map((b) => ({ id: b.id, type: b.type, text: b[b.type]?.rich_text[0]?.plain_text || "" })),
    expandable: true
  });

    if (!session.services.notion.selectedPage) {
      session.services.notion.selectedPage = page.id;
    }
  }

  // GitHub data
  session.services.github = await getGitHubData();

  // Firebase Paths
  session.services.firebase.paths = await getFirebasePaths();

  // Write
  const filePath = path.join(__dirname, "currentSession.json");
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  console.log('✓ currentSession.json updated');
}

module.exports = buildCurrentSession;