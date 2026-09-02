import { useState, useRef, useEffect } from "react";

// Portfolio assistant widget. Talks to /.netlify/functions/chat, which owns
// the Claude API key and the tool-use loop - this component only ever sees
// plain text in and out.

const ENDPOINT = "/.netlify/functions/chat";

const SUGGESTED_PROMPTS = [
  "What have you built recently?",
  "Tell me about CarProject",
  "What's the FlyRank internship?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // [{role: 'user'|'assistant', text}]
  const [history, setHistory] = useState([]); // raw Claude-format history for the API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (res.status === 429) {
        setError("You've hit the message limit for now - try again in a bit.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      setHistory(data.history || []);
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {open ? (
        <div className="w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <span className="text-sm font-medium">Ask about my work</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-gray-300 hover:text-white text-lg leading-none"
            >
              X
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Ask me about projects, skills, or GitHub repos.
                </p>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-gray-900 text-white"
                    : "mr-auto bg-gray-100 text-gray-800"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-lg">
                Thinking...
              </div>
            )}

            {error && <div className="text-xs text-red-600 px-1">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              maxLength={2000}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-gray-900 text-white w-14 h-14 shadow-xl flex items-center justify-center text-xl hover:scale-105 transition-transform"
          aria-label="Open chat"
        >
          Chat
        </button>
      )}
    </div>
  );
}
