const { Octokit } = require("@octokit/rest");

// Validate that GITHUB_PAT environment variable is set
if (!process.env.GITHUB_PAT) {
  throw new Error('GITHUB_PAT environment variable is required but not set');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

async function getGitHubData() {
  try {
    const owner = "incrediblesadi";
    const repo = "akilahapigateway";

    const [branchesRes, issuesRes] = await Promise.all([
      octokit.repos.listBranches({ owner, repo }),
      octokit.issues.listForRepo({ owner, repo: repo, state: "open" })
    ]);

    return {
      repos: [
        {
          name: repo,
          branches: branchesRes.data.map(b => b.name),
          issues: issuesRes.data.map(i => ({
            id: `#${i.number}`,
            title: i.title,
            status: i.state
          }))
        }
      ],
      selectedRepo: repo,
      actions: ["listRepos", "getIssues", "createPR", "getBranches"]
    };
  } catch (error) {
    console.error("GitHub data fetch error:", error.message);
    return { repos: [], selectedRepo: null, actions: [] };
  }
}

module.exports = { getGitHubData };