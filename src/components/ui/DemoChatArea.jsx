import { useState, useRef, useEffect } from "react";

// Set VITE_MODAL_API_URL in your .env file (see .env.example).
const API_URL = import.meta.env.VITE_MODAL_API_URL;
const POLL_INTERVAL_MS = 2500;

async function analyzeOne({ domain, input_type, text }) {
  const submitRes = await fetch(`${API_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirements: [{ domain, input_type, text }] }),
  });
  if (!submitRes.ok) throw new Error(`Submit failed with status ${submitRes.status}`);
  const { call_id } = await submitRes.json();

  while (true) {
    const statusRes = await fetch(`${API_URL}/status?call_id=${call_id}`);
    if (!statusRes.ok) throw new Error(`Status check failed with ${statusRes.status}`);
    const data = await statusRes.json();

    if (data.status === "done") return data.results[0];
    if (data.status === "error") throw new Error(data.error || "Generation failed");

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

function AnalysisCard({ result }) {
  const hasTypes = result.ambiguity_types && result.ambiguity_types.length > 0;
  const hasSpans = result.flagged_spans && result.flagged_spans.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[15px] font-medium text-gray-900">Analysis Result</span>
        <span
          className={`px-2.5 py-0.5 rounded text-[13px] font-semibold ${
            result.is_ambiguous
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {result.is_ambiguous ? "Ambiguous" : "Clear"}
        </span>
      </div>

      <div className="p-4 space-y-4 text-[15px]">
        {result.is_ambiguous && (
          <div>
            <h4 className="font-semibold text-red-800 uppercase tracking-wider text-[12px] mb-1">
              Flaw Analysis
            </h4>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-700 leading-relaxed">
              {hasTypes && <p>Type(s): {result.ambiguity_types.join(", ")}</p>}
              {hasSpans && (
                <p className="mt-1">
                  Flagged phrase(s): {result.flagged_spans.map((s) => `"${s}"`).join(", ")}
                </p>
              )}
              {!hasTypes && !hasSpans && <p>No specific spans flagged.</p>}
            </div>
          </div>
        )}

        {result.clarification_questions && result.clarification_questions.length > 0 && (
          <div>
            <h4 className="font-semibold text-amber-800 uppercase tracking-wider text-[12px] mb-1">
              Clarification Questions
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3">
              {result.clarification_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {result.user_story && (
          <div>
            <h4 className="font-semibold text-emerald-800 uppercase tracking-wider text-[12px] mb-1">
              Refined User Story
            </h4>
            <p className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 text-gray-800 italic">
              "{result.user_story}"
            </p>
          </div>
        )}

        {result.acceptance_criteria && result.acceptance_criteria.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[12px] mb-1">
              Acceptance Criteria
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3">
              {result.acceptance_criteria.map((ac, i) => (
                <li key={i}>{ac}</li>
              ))}
            </ul>
          </div>
        )}

        {result.raw_output && (
          <div>
            <h4 className="font-semibold text-gray-400 uppercase tracking-wider text-[12px] mb-1">
              Raw Model Output (unparsed)
            </h4>
            <p className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-500 whitespace-pre-wrap">
              {result.raw_output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoChatArea() {
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant'|'error', text?, result? }
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState("requirement"); // 'requirement' | 'user_story'
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputText("");
    setIsLoading(true);

    try {
      const result = await analyzeOne({ domain: "general", input_type: inputType, text });
      setMessages((prev) => [...prev, { role: "assistant", result }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: err.message || "Something went wrong analyzing that." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Try the Requirements Analyzer
              </h2>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Paste a requirement or user story below and see how it gets analyzed for
                ambiguity, clarified, and turned into acceptance criteria.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-indigo-600 text-white text-[15px] rounded-2xl rounded-br-sm px-4 py-2.5 max-w-md">
                    {msg.text}
                  </div>
                </div>
              );
            }
            if (msg.role === "error") {
              return (
                <div key={i} className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 text-red-700 text-[15px] rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-md">
                    {msg.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex justify-start w-full">
                <div className="w-full max-w-lg">
                  <AnalysisCard result={msg.result} />
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setInputType("requirement")}
              className={`px-2.5 py-1 rounded-md text-[13px] font-medium transition ${
                inputType === "requirement"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Requirement
            </button>
            <button
              onClick={() => setInputType("user_story")}
              className={`px-2.5 py-1 rounded-md text-[13px] font-medium transition ${
                inputType === "user_story"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              User Story
            </button>
          </div>

          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-300 transition">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. The system should load user profiles very fast."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none py-1.5 max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium rounded-lg transition"
            >
              {isLoading ? "Analyzing..." : "Send"}
            </button>
          </div>
          <p className="text-[12px] text-gray-400 mt-1.5 text-center">
            First request may take up to a minute while the model warms up.
          </p>
        </div>
      </div>
    </main>
  );
}