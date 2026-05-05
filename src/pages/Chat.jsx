import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import ChatArea from "../components/ui/ChatArea";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchChats, fetchMessages, deleteChat } from "../services/chat-service.js";

const INITIAL_MESSAGE = {
  id: 1,
  role: "ai",
  text: "Hi! Paste your requirements and I'll detect any ambiguity, conflicts, or missing details for you.",
};

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);

  const activeChatIdRef = useRef(null);

  // ── Load chats on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const data = await fetchChats(user.id);
        setChats(data);
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    loadChats();
  }, [user]);

  // ── Select a chat → load its messages ─────────────────────────────────────
  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;

    // Already loaded, skip fetch
    if (messagesMap[chatId]) return;

    try {
      const data = await fetchMessages(chatId);
      const formatted = data.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
      }));
      setMessagesMap((prev) => ({ ...prev, [chatId]: formatted }));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // ── New chat ───────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
    navigate("/chat");
  };

  // ── Delete chat (also from Supabase) ──────────────────────────────────────
  const handleDeleteChat = async (id) => {
    // Save for rollback
    const deletedChat = chats.find((c) => c.id === id);

    // Optimistic update
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

    try {
      await deleteChat(id);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      // Rollback
      setChats((prev) => [deletedChat, ...prev]);
    }
  };

  // ── Called by ChatArea when AI creates a new chat in Supabase ─────────────
  const handleChatCreated = (chat) => {
    activeChatIdRef.current = chat.id;
    setActiveChatId(chat.id);
    setChats((prev) => [chat, ...prev]);
  };

  // ── Messages change ────────────────────────────────────────────────────────
  const handleMessagesChange = (messages) => {
    const currentId = activeChatIdRef.current;
    if (currentId) {
      setMessagesMap((prev) => ({ ...prev, [currentId]: messages }));
    }
  };

  const activeMessages = activeChatId
    ? (messagesMap[activeChatId] ?? [INITIAL_MESSAGE])
    : [INITIAL_MESSAGE];

  const activeChat = chats.find((c) => c.id === activeChatId);

  // ── Loading states ─────────────────────────────────────────────────────────
  if (authLoading || loadingChats) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <ChatArea
        key={activeChatId ?? "new"}
        title={activeChat?.title ?? "New chat"}
        messages={activeMessages}
        onMessagesChange={handleMessagesChange}
        chatId={activeChatId}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default Chat;