// tools.js
// Fixed allowlist of tools the agent may call. Nothing outside this list
// is ever exposed to the model — no arbitrary URL fetch, no code execution.

const GITHUB_USERNAME = "Siseko001";
const GITHUB_API = "https://api.github.com";

// Curated, hand-written project info you control fully. This is the
// source of truth for anything you don't want the model inferring from
// a README (e.g. framing, links, demo status).
const PROJECT_DETAILS = {
  carproject: {
    name: "CarProject",
    repo: "Siseko001/CarProject",
    summary:
      "A data analysis project comparing car models — price vs. mileage, brand comparisons, " +
      "and price prediction using a random forest / tree-based model. Built with pandas, " +
      "matplotlib/seaborn, and scikit-learn, in a Jupyter notebook.",
    links: {
      github: "https://github.com/Siseko001/CarProject",
    },
  },
  "face-recognition": {
    name: "Face Recognition Demo",
    repo: null,
    summary:
      "Started as a face recognition assignment (Haar cascade detector + CNN classifier). " +
      "Presented on the portfolio as a live, browser-based face login demo built with " +
      "face-api.js, so any visitor can enroll and match their own face, plus a walkthrough " +
      "video covering both the original notebook pipeline and the browser demo.",
    links: {},
  },
  "flyrank-internship": {
    name: "FlyRank AI Internship",
    repo: "Siseko001/ML_FlyRank",
    summary:
      "Self-paced remote AI internship, covering both the Applied AI/ML track and the " +
      "General AI Fluency track. Working through weekly notebook assignments (w01–w11) " +
      "plus a capstone project.",
    links: {
      github: "https://github.com/Siseko001/ML_FlyRank",
    },
  },
};

// --- Tool schemas sent to the Claude API -----------------------------------

const toolSchemas = [
  {
    name: "get_github_repos",
    description:
      "Fetch the visitor-facing list of public GitHub repositories for the portfolio owner, " +
      "with name, description, primary language, and last-updated date. Use this for general " +
      "'what have you built' or 'what are you working on' questions.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_repo_readme",
    description:
      "Fetch the README content of a specific GitHub repository, for questions that need " +
      "detail beyond a one-line summary (methodology, tech stack, results described in the README).",
    input_schema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository name, e.g. 'CarProject' or 'ML_FlyRank'.",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "get_project_details",
    description:
      "Look up curated, portfolio-owner-approved details for a named project: CarProject, " +
      "face-recognition, or flyrank-internship. Prefer this over get_repo_readme when the " +
      "project is one of these three, since it's maintained specifically for visitor questions.",
    input_schema: {
      type: "object",
      properties: {
        project_slug: {
          type: "string",
          enum: Object.keys(PROJECT_DETAILS),
          description: "One of: carproject, face-recognition, flyrank-internship.",
        },
      },
      required: ["project_slug"],
    },
  },
];

// --- Tool implementations ---------------------------------------------------
// Each returns a plain string (or JSON string) that gets wrapped as an
// untrusted <tool_result> before being sent back to the model.

async function getGithubRepos() {
  const res = await fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!res.ok) {
    return JSON.stringify({ error: `GitHub API returned ${res.status}` });
  }

  const repos = await res.json();
  const summary = repos
    .filter((r) => !r.fork)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      updated_at: r.updated_at,
      url: r.html_url,
    }));

  return JSON.stringify(summary);
}

async function getRepoReadme(repo) {
  // Guard: only allow repos under the owner's account, never an arbitrary
  // visitor-supplied owner/repo string.
  const safeRepo = String(repo).replace(/[^a-zA-Z0-9._-]/g, "");
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_USERNAME}/${safeRepo}/readme`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });

  if (!res.ok) {
    return JSON.stringify({ error: `Could not fetch README for ${safeRepo} (status ${res.status})` });
  }

  const text = await res.text();
  // Cap length so one huge README can't blow the context budget or smuggle
  // an oversized prompt-injection payload.
  return text.slice(0, 6000);
}

function getProjectDetails(projectSlug) {
  const details = PROJECT_DETAILS[projectSlug];
  if (!details) {
    return JSON.stringify({ error: `Unknown project_slug: ${projectSlug}` });
  }
  return JSON.stringify(details);
}

// Dispatcher used by chat.js. Throws only on programmer error (unknown tool
// name) — real failures (network, 404) are returned as data so the model
// can react gracefully instead of the function crashing.
async function runTool(name, input) {
  switch (name) {
    case "get_github_repos":
      return getGithubRepos();
    case "get_repo_readme":
      return getRepoReadme(input.repo);
    case "get_project_details":
      return getProjectDetails(input.project_slug);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export { toolSchemas, runTool };
