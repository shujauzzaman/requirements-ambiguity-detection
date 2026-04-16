import { useRef, useEffect, useState } from "react";
import { fetchClassificationResponse } from "../../services/classification-model";
import { useAuth } from "../../auth/AuthContext.jsx"; 

const ChatArea = ({ title = "New chat", messages = [], onMessagesChange }) => {

  const { user } = useAuth();

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Structured form state
  const [form, setForm] = useState({
    role: "",
    goal: "",
    benefit: "",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isDisabled =
    loading ||
    !form.role.trim() ||
    !form.goal.trim() ||
    !form.benefit.trim();

  // COPY FUNCTION (enhanced from demo)
  const handleCopy = async (html, id) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const cleanText = div.innerText;

    await navigator.clipboard.writeText(cleanText);

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 4000);
  };

  const getInitials = (email) => {
    if (!email) return "You";
    return email.slice(0, 2).toUpperCase();
  };

  // SEND MESSAGE (now uses structured input)
  const handleSend = async () => {
    if (isDisabled) return;

    const structuredText = `As a ${form.role}, I want to ${form.goal}, so that ${form.benefit}`;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: structuredText,
    };

    setForm({ role: "", goal: "", benefit: "" });
    setLoading(true);

    const updated = [...messages, userMessage];

    // Add thinking message
    const thinkingMessage = {
      id: "thinking",
      role: "ai",
      text: "thinking",
    };

    onMessagesChange([...updated, thinkingMessage]);

    try {
      const aiText = await fetchClassificationResponse(structuredText);

      const aiMessage = {
        id: Date.now() + 1,
        role: "ai",
        text: aiText,
      };

      onMessagesChange([...updated, aiMessage]);
    } catch (err) {
      onMessagesChange([
        ...updated,
        {
          id: Date.now() + 2,
          role: "ai",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isDisabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex flex-col flex-1 h-full bg-white overflow-hidden">
      {/* Top bar */}
      <div className="h-[52px] flex items-center gap-3 px-5 border-b border-gray-200 flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${
                msg.role === "ai"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {msg.role === "ai" ? "AI" : getInitials(user?.email)}
            </div>

            {/* Message */}
            <div className="relative group max-w-[72%]">
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-gray-50 border border-gray-200 text-gray-700 rounded-xl"
                    : "bg-indigo-600 text-white rounded-xl"
                }`}
              >
                {msg.id === "thinking" ? (
                  <div className="flex items-center gap-2 text-gray-500 animate-pulse">
                    AI is thinking
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    </span>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                )}
              </div>

              {/* COPY BUTTON (enhanced from demo - works for all non-thinking messages) */}
              {msg.id !== "thinking" && (
                <button
                  onClick={() => handleCopy(msg.text, msg.id)}
                  className={`absolute -bottom-6 transition-opacity duration-200
                    ${msg.role === "ai" ? "left-1" : "right-1"}
                    ${
                      copiedId === msg.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }
                    text-gray-400 hover:text-gray-600`}
                >
                  <div className="relative w-4 h-4">
                    {/* COPY ICON */}
                    <svg
                      className={`absolute inset-0 transition-all duration-200 ${
                        copiedId === msg.id
                          ? "opacity-0 scale-90"
                          : "opacity-100 scale-100"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>

                    {/* CHECK ICON */}
                    <svg
                      className={`absolute inset-0 transition-all duration-200 ${
                        copiedId === msg.id
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-90"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* STRUCTURED INPUT (from demo) */}
      <div className="px-5 py-4 border-t border-gray-200">
        <div
          className={`flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 ${
            loading ? "opacity-60" : ""
          }`}
        >
          <span>As a</span>

          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            disabled={loading}
            className="w-[120px] bg-white border px-2 py-1 rounded-md outline-none"
          />

          <span>, I want to</span>

          <input
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            disabled={loading}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[140px] bg-white border px-2 py-1 rounded-md outline-none"
          />

          <span>, so that</span>

          <input
            value={form.benefit}
            onChange={(e) => setForm({ ...form, benefit: e.target.value })}
            disabled={loading}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[140px] bg-white border px-2 py-1 rounded-md outline-none"
          />

          <button
            onClick={handleSend}
            disabled={isDisabled}
            className="w-8 h-8 bg-indigo-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>
      </div>
    </main>
  );
};

export default ChatArea;