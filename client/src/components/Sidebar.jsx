
import {
    LayoutDashboard,
    MessageSquare,
    Headphones,
    Ticket,
    BarChart3,
    Settings,
  } from "lucide-react";
  
  import { NavLink } from "react-router-dom";
  
  const menuItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Conversations", path: "/conversations", icon: MessageSquare },
    { name: "Voice Assistant", path: "/voice-assistant", icon: Headphones },
    { name: "Support Tickets", path: "/tickets", icon: Ticket },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ];
  
  function Sidebar() {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:flex md:flex-col">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold text-white">
            V
          </div>
  
          <div>
            <h1 className="text-xl font-bold">VaaniOS</h1>
            <p className="text-xs text-slate-400">VOICE INTELLIGENCE</p>
          </div>
        </div>
  
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
  
        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
  
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
  
        {/* Settings */}
        <div className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50">
            <Settings size={19} />
            Settings
          </button>
  
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
              VK
            </div>
  
            <div>
              <p className="text-sm font-semibold">Vaani Admin</p>
              <p className="text-xs text-slate-400">Business account</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }
  
  export default Sidebar;
  