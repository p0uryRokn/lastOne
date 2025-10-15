// scripts/gh-notes.js
// Usage from semantic-release/exec: node scripts/gh-notes.js <version> <previousTagOrEmpty> <branch> <repoUrl>
import {execSync} from "node:child_process";

const [, , version, prevTag, branch, repoUrl] = process.argv;

// repoUrl looks like: https://github.com/<owner>/<repo>.git
const path = new URL(repoUrl).pathname.replace(/\.git$/, "");
const [owner, repo] = path.split("/").filter(Boolean);

// Build payload for GitHub's "generate release notes" endpoint
const payload = {
  tag_name: `v${version}`,               // adjust if your tagFormat differs
  target_commitish: branch,
  // Only include previous_tag_name if we actually have one
  ...(prevTag ? { previous_tag_name: prevTag } : {})
};

const res = fetch(`https://api.github.com/repos/${owner}/${repo}/releases/generate-notes`, {
  method: "POST",
  headers: {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28"
  },
  body: JSON.stringify(payload)
});

const json = await res.then(r => r.json());
if (!json?.body) {
  console.error("Failed to generate notes:", json);
  process.exit(1);
}

// IMPORTANT: semantic-release/exec expects the notes on stdout
process.stdout.write(json.body);
