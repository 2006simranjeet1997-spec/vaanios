
import { useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";

function Header() {
  const location = useLocation();

  const pageNames = {
    "/": "Dashboard",
    "/conversations": "Conversations",
    "/voice-assistant": "Voice Assistant",
    "/tickets": "Support Tickets",
    "/analytics": "Analytics",
  };

  const currentPage = pageNames[location.pathname] || "Dashboard";

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <p className="text-sm text-slate-400">
          Workspace / {currentPage}
        </p>
        <h1 className="text-xl font-bold text-slate-800">
          {currentPage}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-200 p-3 text-slate-500">
          <Search size={19} />
        </button>

        <button className="relative rounded-xl border border-slate-200 p-3 text-slate-500">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500" />
        </button>

        <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 sm:flex">
          VK
        </div>
      </div>
    </header>
  );
}

export default Header;
