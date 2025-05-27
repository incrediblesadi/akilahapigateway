const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-actual-token'
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
          })
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