import {
    MessageSquare,
    Ticket,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Phone,
    Mic,
  } from "lucide-react";
  
  const stats = [
    {
      title: "Total Conversations",
      value: "1,284",
      change: "+12.8%",
      positive: true,
      icon: MessageSquare,
    },
    {
      title: "AI Resolved",
      value: "946",
      change: "+8.2%",
      positive: true,
      icon: CheckCircle2,
    },
    {
      title: "Pending Tickets",
      value: "38",
      change: "+4.3%",
      positive: false,
      icon: Ticket,
    },
    {
      title: "Avg. Response Time",
      value: "1.8s",
      change: "-12.5%",
      positive: true,
      icon: Clock,
    },
  ];
  
  const conversations = [
    {
      name: "Aarav Sharma",
      issue: "Order delivery delay",
      language: "Hinglish",
      status: "Resolved",
      time: "2 min ago",
      initials: "AS",
    },
    {
      name: "Priya Mehta",
      issue: "Refund request",
      language: "Hindi",
      status: "Pending",
      time: "8 min ago",
      initials: "PM",
    },
    {
      name: "Rahul Verma",
      issue: "Product information",
      language: "English",
      status: "Resolved",
      time: "15 min ago",
      initials: "RV",
    },
    {
      name: "Simran Kaur",
      issue: "Payment issue",
      language: "Punjabi",
      status: "Escalated",
      time: "24 min ago",
      initials: "SK",
    },
  ];
  
  function Overview() {
    return (
      <div className="text-slate-800">
  
        {/* Dashboard Introduction */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor your AI-powered customer conversations.
          </p>
        </div>
  
        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
  
            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.title}</p>
  
                  <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                    <Icon size={19} />
                  </div>
                </div>
  
                <h3 className="mt-5 text-3xl font-bold tracking-tight">
                  {stat.value}
                </h3>
  
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {stat.positive ? (
                    <ArrowUpRight size={15} className="text-emerald-500" />
                  ) : (
                    <ArrowDownRight size={15} className="text-rose-500" />
                  )}
  
                  <span
                    className={
                      stat.positive ? "text-emerald-600" : "text-rose-500"
                    }
                  >
                    {stat.change}
                  </span>
  
                  <span className="text-slate-400">vs last month</span>
                </div>
              </div>
            );
          })}
        </section>
  
        {/* Voice Assistant Banner */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white md:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                <span className="text-xs font-medium text-violet-100">
                  AI VOICE SYSTEM
                </span>
              </div>
  
              <h3 className="text-2xl font-bold">
                Your voice assistant is ready.
              </h3>
  
              <p className="mt-2 max-w-lg text-sm leading-6 text-violet-100">
                Manage multilingual customer conversations and let your AI
                assistant handle support requests.
              </p>
            </div>
  
            <button className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50">
              <Mic size={18} />
              Launch Voice Assistant
            </button>
          </div>
        </section>
  
        {/* Recent Conversations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Recent Conversations</h3>
              <p className="mt-1 text-sm text-slate-400">
                Latest customer interactions
              </p>
            </div>
  
            <button className="text-sm font-semibold text-violet-600 hover:text-violet-800">
              View all
            </button>
          </div>
  
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="pb-4 font-medium">CUSTOMER</th>
                  <th className="pb-4 font-medium">ISSUE</th>
                  <th className="pb-4 font-medium">LANGUAGE</th>
                  <th className="pb-4 font-medium">STATUS</th>
                  <th className="pb-4 font-medium">TIME</th>
                </tr>
              </thead>
  
              <tbody>
                {conversations.map((conversation) => (
                  <tr
                    key={conversation.name}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-700">
                          {conversation.initials}
                        </div>
  
                        <span className="text-sm font-semibold">
                          {conversation.name}
                        </span>
                      </div>
                    </td>
  
                    <td className="py-4 text-sm text-slate-500">
                      {conversation.issue}
                    </td>
  
                    <td className="py-4 text-sm text-slate-500">
                      {conversation.language}
                    </td>
  
                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          conversation.status === "Resolved"
                            ? "bg-emerald-50 text-emerald-700"
                            : conversation.status === "Pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {conversation.status}
                      </span>
                    </td>
  
                    <td className="py-4 text-sm text-slate-400">
                      {conversation.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  
        {/* Footer */}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 VaaniOS. All rights reserved.</p>
  
          <p className="flex items-center gap-2">
            <Phone size={13} />
            Powered by Gnani AI voice technology
          </p>
        </footer>
  
      </div>
    );
  }
  
  export default Overview;