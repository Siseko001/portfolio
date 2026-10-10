// netlify/functions/chat.mjs
// Portfolio chat agent: Claude + a GitHub tool, with simple per-IP rate limiting.
// Called from the frontend at POST /.netlify/functions/chat

const MODEL = "claude-sonnet-5-5";
const GITHUB_USER = "Siseko001";
const MAX_TOOL_ROUNDS = 4;

// ---- Edit this to describe yourself accurately ----
const SYSTEM_PROMPT = `You are the assistant on Siseko's portfolio website. You answer visitors' questions about Siseko and his work, in a friendly, concise way.

About Siseko:
- Based in South Africa. Diploma in Information Technology (Cape Peninsula University of Technology), Gen AI/Artificial Intelligence studies at Regenesys Education, and a MySQL certificate from Torque IT.
- Completing the FlyRank AI Internship (Applied AI/ML track and General AI Fluency track).
- Projects include CarProject (car model data analysis with pandas and scikit-learn) and a face recognition project (Haar cascade + CNN classifier, with a browser demo).

You have a tool to look up his public GitHub repositories. Use it when a visitor asks about a specific project or wants details you don't have. Only state facts you know or got from the tool; if you don't know something, say so and suggest the contact form. Keep answers short.`;

// ---- Tools ----
const TOOLS = [
  {
    name: "get_github_repo",
    description:
      "Fetch details about one of Siseko's public GitHub repositories (description, language, topics, last update, README excerpt). Use the exact repo name, e.g. 'CarProject'.",
    input_schema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository name, e.g. CarProject" },
      },
      required: ["repo"],
    },
  },
  {
    name: "list_github_repos",
    description: "List Siseko's public GitHub repositories with short descriptions.",
    input_schema: { type: "object", properties: {} },
  },
];

async function gh(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-chat" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(`https://api.github.com${path}`, { headers });
}

async function runTool(name, input) {
  try {
    if (name === "list_github_repos") {
      const res = await gh(`/users/${GITHUB_USER}/repos?per_page=30&sort=updated`);
      if (!res.ok) return `GitHub error ${res.status}`;
      const repos = await res.json();
      return JSON.stringify(
        repos.map((r) => ({ name: r.name, description: r.description, language: r.language }))
      );
    }
    if (name === "get_github_repo") {
      const repo = String(input?.repo || "").replace(/[^\w.-]/g, "");
      if (!repo) return "No repo name given.";
      const res = await gh(`/repos/${GITHUB_USER}/${repo}`);
      if (res.status === 404) return `No public repo named "${repo}" found.`;
      if (!res.ok) return `GitHub error ${res.status}`;
      const r = await res.json();
      let readme = "";
      const rr = await gh(`/repos/${GITHUB_USER}/${repo}/readme`);
      if (rr.ok) {
        const j = await rr.json();
        readme = Buffer.from(j.content || "", "base64").toString("utf8").slice(0, 2000);
      }
      return JSON.stringify({
        name: r.name,
        description: r.description,
        language: r.language,
        topics: r.topics,
        updated: r.pushed_at,
        url: r.html_url,
        readme_excerpt: readme,
      });
    }
    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Tool failed: ${e.message}`;
  }
}

// ---- Simple rate limit (in-memory, per warm instance: best-effort cost control) ----
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 15;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// ---- Handler ----
export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Server is missing ANTHROPIC_API_KEY" }, 500);

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (rateLimited(ip)) {
    return json({ error: "Too many messages. Please try again in a few minutes." }, 429);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Keep only the last 20 plain-text messages and cap their size
  const incoming = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const messages = incoming
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Send a messages array ending with a user message" }, 400);
  }

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 700,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Anthropic error", res.status, detail);
        return json({ error: `Anthropic API error ${res.status}`, detail }, 502);
      }

      const data = await res.json();

      if (data.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: data.content });
        const results = [];
        for (const block of data.content) {
          if (block.type === "tool_use") {
            results.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: await runTool(block.name, block.input),
            });
          }
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      const reply = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return json({ reply: reply || "Sorry, I couldn't come up with an answer." });
    }
    return json({ reply: "Sorry, that took too many steps. Try asking more simply." });
  } catch (e) {
    console.error(e);
    return json({ error: "Server error", detail: e.message }, 500);
  }
};
