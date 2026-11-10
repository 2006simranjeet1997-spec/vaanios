
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mic,
  LoaderCircle,
  RefreshCw,
  Phone,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const STAT_CONFIG = [
  {
    title: "Total Conversations",
    key: "conversations",
    icon: MessageSquare,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Open Tickets",
    key: "open",
    icon: Ticket,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "In Progress",
    key: "inProgress",
    icon: Clock,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Resolved Tickets",
    key: "resolved",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Escalated Tickets",
    key: "escalated",
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-600",
  },
];

function getRecords(payload, keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload.data) return getRecords(payload.data, keys);
  if (payload.result) return getRecords(payload.result, keys);

  return [];
}

function formatTime(dateValue) {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700";

    case "open":
      return "bg-amber-50 text-amber-700";

    case "in progress":
      return "bg-blue-50 text-blue-700";

    case "escalated":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function Overview() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    conversations: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
  });

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [conversationResponse, ticketResponse] = await Promise.all([
        fetch(`${API_URL}/api/conversations`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/tickets`, {
          credentials: "include",
        }),
      ]);

      if (
        conversationResponse.status === 401 ||
        conversationResponse.status === 403 ||
        ticketResponse.status === 401 ||
        ticketResponse.status === 403
      ) {
        navigate("/login");
        return;
      }

      if (!conversationResponse.ok || !ticketResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const [conversationData, ticketData] = await Promise.all([
        conversationResponse.json(),
        ticketResponse.json(),
      ]);

      const conversationRecords = getRecords(conversationData, [
        "conversations",
        "results",
        "items",
      ]);

      const ticketRecords = getRecords(ticketData, [
        "tickets",
        "results",
        "items",
      ]);

      const countStatus = (status) =>
        ticketRecords.filter(
          (ticket) => ticket.status?.toLowerCase() === status
        ).length;

      setStats({
        conversations: conversationRecords.length,
        open: countStatus("open"),
        inProgress: countStatus("in progress"),
        resolved: countStatus("resolved"),
        escalated: countStatus("escalated"),
      });

      const recentConversations = [...conversationRecords]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5)
        .map((item) => {
          const name = item.customerName || "Unknown Customer";

          return {
            id: item._id,
            name,
            issue:
              item.transcript ||
              item.category ||
              "Customer conversation",
            language: item.language || "Not specified",
            status: item.status || "Open",
            time: formatTime(item.createdAt),
            initials:
              name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase() || "?",
          };
        });

      setConversations(recentConversations);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      setError(error.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="text-slate-800">
      {/* Dashboard Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor your AI-powered customer conversations and support tickets.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CONFIG.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-500">{stat.title}</p>

                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                  <Icon size={19} />
                </div>
              </div>

              <h3 className="mt-5 text-3xl font-bold tracking-tight">
                {loading ? (
                  <LoaderCircle
                    size={25}
                    className="animate-spin text-violet-500"
                  />
                ) : (
                  stats[stat.key].toLocaleString()
                )}
              </h3>

              <p className="mt-3 text-xs text-slate-400">
                {loading ? "Updating..." : "Live database count"}
              </p>
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

          <button
            onClick={() => navigate("/voice-assistant")}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
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

          <button
            onClick={() => navigate("/conversations")}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            View all
          </button>
        </div>

        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <LoaderCircle
              size={19}
              className="animate-spin text-violet-600"
            />
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare
              size={30}
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="text-sm font-medium text-slate-600">
              No conversations yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New customer interactions will appear here.
            </p>
          </div>
        ) : (
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
                    key={conversation.id || conversation.name}
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
                      <span className="block max-w-xs truncate">
                        {conversation.issue}
                      </span>
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {conversation.language}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                          conversation.status
                        )}`}
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
        )}
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
