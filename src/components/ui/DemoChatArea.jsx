import { useState, useRef, useEffect } from "react";
import { fetchClassificationResponse } from "../../services/classification-model";

const INITIAL_MESSAGE = {
  id: 1,
  role: "ai",
  text: "Hi! Paste your requirements and I'll detect any ambiguity, conflicts, or missing details for you.",
};

const DemoChatArea = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputRef.current?.value.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), role: "user", text: trimmed };
    inputRef.current.value = "";

    const updated = [...messages, userMessage];
    setMessages(updated);

    const aiText = await fetchClassificationResponse(trimmed);
    const aiMessage = { id: Date.now() + 1, role: "ai", text: aiText };
    setMessages([...updated, aiMessage]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex flex-col flex-1 h-full bg-white overflow-hidden">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${
                msg.role === "ai"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {msg.role === "ai" ? "AI" : "You"}
            </div>
            <div
              className={`max-w-[72%] px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-gray-50 border border-gray-200 text-gray-700 rounded-tl rounded-tr-xl rounded-br-xl rounded-bl-xl"
                  : "bg-indigo-600 text-white rounded-tl-xl rounded-tr rounded-br-xl rounded-bl-xl"
              }`}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200">
        <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <textarea
            ref={inputRef}
            rows={1}
            onKeyDown={handleKeyDown}
            placeholder="Paste your requirements here..."
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400 leading-relaxed max-h-[120px]"
          />
          <button
            onClick={handleSend}
            className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="white" strokeWidth={2.2} viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

    </main>
  );
};

export default DemoChatArea;