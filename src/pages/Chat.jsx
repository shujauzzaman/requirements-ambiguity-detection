import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import ChatArea from "../components/ui/ChatArea";

const INITIAL_MESSAGE = {
  id: 1,
  role: "ai",
  text: "Hi! Paste your requirements and I'll detect any ambiguity, conflicts, or missing details for you.",
};

const Chat = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});

  // Ref to track the current chat ID instantly (no re-render lag)
  const activeChatIdRef = useRef(null);

  const activeMessages = activeChatId
    ? (messagesMap[activeChatId] ?? [INITIAL_MESSAGE])
    : [INITIAL_MESSAGE];

  const activeChat = chats.find((c) => c.id === activeChatId);

  const handleNewChat = () => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
    navigate("/chat");
  };

  const handleDeleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setMessagesMap((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (activeChatIdRef.current === id) {
      setActiveChatId(null);
      activeChatIdRef.current = null;
      navigate("/chat");
    }
  };

  const handleMessagesChange = (messages) => {
    // If no chat exists yet, create it once using the ref
    if (!activeChatIdRef.current) {
      const newId = Date.now();
      activeChatIdRef.current = newId; // set ref immediately — no re-render lag

      const newChat = { id: newId, title: "New chat", group: "today" };
      setChats((prev) => [newChat, ...prev]);
      setMessagesMap({ [newId]: messages });
      setActiveChatId(newId);
    } else {
      setMessagesMap((prev) => ({
        ...prev,
        [activeChatIdRef.current]: messages,
      }));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={handleDeleteChat}
      />
      <ChatArea
        key={activeChatId ?? "new"}
        title={activeChat?.title ?? "New chat"}
        messages={activeMessages}
        onMessagesChange={handleMessagesChange}
      />
    </div>
  );
};

export default Chat;