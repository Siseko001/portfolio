# Portfolio Assistant (tool-using agent)

A Claude-powered chat widget for the portfolio that can call tools to answer
visitor questions accurately — GitHub repo lookups, README fetches, and
curated project details — instead of relying on a static hardcoded bio.

## Files

- `netlify/functions/chat.js` — serverless endpoint. Owns the Claude API key,
  runs the tool-use loop (max 3 rounds), does basic IP rate limiting.
- `netlify/functions/tools.js` — the fixed tool allowlist: `get_github_repos`,
  `get_repo_readme`, `get_project_details`. Update `PROJECT_DETAILS` here with
  your own project copy.
- `src/components/ChatWidget.jsx` — the React island: a floating chat bubble
  that expands into a chat panel. Drop it into an Astro page as a client
  island (`client:load` or `client:idle`).

## Setup

1. In your Astro project, copy `netlify/functions/` to your project root and
   `src/components/ChatWidget.jsx` into `src/components/`.
2. In the Netlify dashboard (or `.env` for local dev with `netlify dev`), set:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   Never commit this key or expose it to the client — it's only read inside
   `chat.js`, which runs server-side.
3. In `tools.js`, update `GITHUB_USERNAME` and the `PROJECT_DETAILS` object
   with your real project slugs/copy.
4. Add the widget to a layout or page:
   ```astro
   ---
   import ChatWidget from "../components/ChatWidget.jsx";
   ---
   <ChatWidget client:idle />
   ```
5. `netlify dev` to test locally, then deploy as usual — Netlify auto-detects
   functions under `netlify/functions/`.

## Guardrails already built in

- **Fixed tool allowlist** — the model can only call the three defined tools,
  never arbitrary URLs or code.
- **Untrusted tool output** — README/tool content is wrapped in a
  `<tool_result untrusted="true">` tag and the system prompt tells the model
  to treat it as data, not instructions (mitigates prompt injection from a
  README you don't fully control).
- **Scope-limited system prompt** — instructs the agent to refuse unrelated
  requests (general coding help, unrelated advice) and never reveal the
  system prompt or API internals.
- **Tool-call cap** — max 3 tool rounds per message, so a confused or
  adversarial conversation can't loop indefinitely and run up API cost.
- **Repo name sanitization** — `get_repo_readme` strips anything that isn't
  alphanumeric/`.`/`-`/`_` before building the GitHub URL, so a visitor can't
  redirect it to fetch an arbitrary repo outside your account.
- **Basic IP rate limiting** — 10 messages/hour/IP, in-memory. Good enough to
  start; see the note in `chat.js` about swapping in Netlify Blobs or
  Upstash Redis for a limit that survives cold starts.
- **Message length cap** — 2000 chars, rejected server-side before it ever
  reaches the model.
- **Graceful tool failure** — GitHub API errors are returned as data the
  model can react to ("couldn't fetch that right now"), never a raw stack
  trace to the visitor.

## Still worth doing before shipping

- Swap the in-memory rate limiter for a persistent store if you expect any
  real traffic (Netlify Blobs is the easiest, since you're already on Netlify).
- Run the 5 eval cases we defined earlier against the deployed function
  before pointing real visitors at it.
- Consider logging tool calls + final answers (server-side only) so you can
  spot-check for hallucination or abuse after launch.
