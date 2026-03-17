import { Link } from "react-router-dom";
import DemoChatArea from "../components/ui/DemoChatArea.jsx";

const Demo = () => {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 min-w-[260px] h-full bg-white border-r border-gray-200 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <span className="text-[15px] font-medium text-gray-900 tracking-tight px-2 py-1">
            Analyzer
          </span>
        </div>

        {/* Demo notice — where recents would be */}
        <div className="flex-1 px-3 py-4 flex flex-col gap-3">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[12px] font-medium text-indigo-700">Demo mode</span>
            </div>
            <p className="text-[12px] text-indigo-600 leading-relaxed mb-3">
              You're trying a demo. Chats are not saved and will be lost on refresh.
            </p>
            <Link
              to="/signup"
              className="block w-full text-center text-[12px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign up — it's free
            </Link>
          </div>
        </div>

        {/* Footer — Guest */}
        <div className="p-2 border-t border-gray-200">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 text-[11px] font-medium flex items-center justify-center flex-shrink-0">
              G
            </div>
            <span className="flex-1 text-[12px] text-gray-400 truncate">
              Guest
            </span>
          </div>
        </div>

      </aside>

      {/* Chat area — fully self contained */}
      <DemoChatArea />

    </div>
  );
};

export default Demo;