import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ chats = [], activeChatId, onNewChat, onSelectChat, onDeleteChat }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null); // holds chat id to delete
  const dropdownRef = useRef(null);

  const getInitials = (email) => {
    if (!email) return "?";
    return email.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate("/");
  };

  const handleDeleteClick = (chatId) => {
    setChatToDelete(chatId); // open modal
  };

  const handleConfirmDelete = () => {
    onDeleteChat(chatToDelete);
    setChatToDelete(null); // close modal
  };

  const handleCancelDelete = () => {
    setChatToDelete(null); // close modal
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ── Confirm Delete Modal ───────────────────────────────────────────── */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={handleCancelDelete}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-lg w-[320px] p-5 flex flex-col gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-[14px] font-medium text-gray-900">Delete chat?</p>
              <p className="text-[12px] text-gray-400 mt-1">
                This will permanently delete the chat and all its messages. This action cannot be undone.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-[13px] text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-64 min-w-[260px] h-full bg-white border-r border-gray-200 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <span className="text-[15px] font-medium text-gray-900 tracking-tight px-2 py-1">
            Req-Analyzer
          </span>
          <button
            onClick={onNewChat}
            title="New chat"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {chats.length > 0 ? (
            <>
              <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-gray-400 tracking-wide">
                Recents
              </p>
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  active={chat.id === activeChatId}
                  onClick={() => onSelectChat(chat.id)}
                  onDelete={() => handleDeleteClick(chat.id)}
                />
              ))}
            </>
          ) : (
            <p className="px-3 pt-4 text-[12px] text-gray-400 text-center">
              No chats yet
            </p>
          )}
        </div>

        {/* Footer / User */}
        <div className="p-2 border-t border-gray-200 relative" ref={dropdownRef}>
          {dropdownOpen && (
            <div className="absolute bottom-[60px] left-2 right-2 bg-white border border-gray-200 rounded-xl shadow-sm py-1 z-10">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[12px] font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-[11px] text-gray-400">Free plan</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors rounded-lg mt-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
              dropdownOpen ? "bg-indigo-50" : "hover:bg-indigo-50"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[11px] font-medium flex items-center justify-center flex-shrink-0">
              {getInitials(user?.email)}
            </div>
            <span className="flex-1 text-[12px] text-gray-600 truncate text-left">
              {user?.email ?? "Guest"}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
            >
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>

      </aside>
    </>
  );
};

const ChatItem = ({ chat, active, onClick, onDelete }) => (
  <div
    className={`group w-full flex items-center gap-2 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
      active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <button
      onClick={onClick}
      className="flex items-center gap-2 flex-1 min-w-0 text-left"
    >
      <svg className="w-3.5 h-3.5 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      <span className="truncate">{chat.title}</span>
    </button>

    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      title="Delete chat"
      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    </button>
  </div>
);

export default Sidebar;