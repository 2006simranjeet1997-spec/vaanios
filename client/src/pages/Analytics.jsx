
import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Globe,
  Ticket,
  Headset,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`;

function Analytics() {
  const [conversations, setConversations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const [conversationResponse, ticketResponse] = await Promise.all([
          fetch(`${API_URL}/conversations`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${API_URL}/tickets`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (conversationResponse.status === 401 || ticketResponse.status === 401) {
          throw new Error("Your session is not authorized. Please sign in again.");
        }

        if (!conversationResponse.ok || !ticketResponse.ok) {
          throw new Error(
            `Analytics API error: Conversations ${conversationResponse.status}, Tickets ${ticketResponse.status}`
          );
        }

        const conversationData = await conversationResponse.json();
        const ticketData = await ticketResponse.json();

        if (!conversationData.success || !ticketData.success) {
          throw new Error("Could not load analytics data.");
        }

        if (!cancelled) {
          setConversations(conversationData.conversations || []);
          setTickets(ticketData.tickets || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch analytics data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalTickets = tickets.length;

  const escalatedTickets = tickets.filter(
    (item) => item.status === "Escalated"
  ).length;

  const openTickets = tickets.filter(
    (item) => item.status === "Open"
  ).length;

  const inProgressTickets = tickets.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (item) => item.status === "Resolved"
  ).length;

  const totalConversations = conversations.length;

  const resolutionRate =
    totalTickets > 0
      ? ((resolvedTickets / totalTickets) * 100).toFixed(1)
      : "0.0";

  // Language distribution
  const languageCounts = {};

  conversations.forEach((conversation) => {
    const language = conversation.language || "Unknown";
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  });

  const languageData = Object.entries(languageCounts)
    .map(([language, count]) => ({
      language,
      count,
      percentage:
        totalConversations > 0
          ? Math.round((count / totalConversations) * 100)
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const languageColors = [
    "bg-violet-600",
    "bg-indigo-500",
    "bg-fuchsia-500",
    "bg-amber-500",
    "bg-emerald-500",
  ];

  // Weekly activity
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = conversations.filter((conversation) => {
      const createdAt = new Date(conversation.createdAt);
      return createdAt >= date && createdAt < nextDate;
    }).length;

    return {
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      conversations: count,
    };
  });

  const maxConversations = Math.max(
    ...weeklyData.map((item) => item.conversations),
    1
  );

  // Ticket categories
  const categoryCounts = {};

  tickets.forEach((ticket) => {
    const category = ticket.category || "Other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage:
        totalTickets > 0
          ? Math.round((count / totalTickets) * 100)
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-600">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold md:text-3xl">Analytics</h2>
        <p className="mt-2 text-sm text-slate-500">
          Understand your customer conversations and AI performance.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Based on live VaaniOS database records.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Conversations</p>
            <MessageSquare className="text-violet-600" size={20} />
          </div>
          <h3 className="mt-4 text-3xl font-bold">{totalConversations}</h3>
          <p className="mt-2 text-xs text-slate-400">
            Recorded conversations
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Resolution Rate</p>
            <CheckCircle2 className="text-emerald-600" size={20} />
          </div>
          <h3 className="mt-4 text-3xl font-bold">{resolutionRate}%</h3>
          <p className="mt-2 text-xs text-slate-400">
            Tickets marked Resolved
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Support Tickets</p>
            <Ticket className="text-indigo-600" size={20} />
          </div>
          <h3 className="mt-4 text-3xl font-bold">{totalTickets}</h3>
          <p className="mt-2 text-xs text-slate-400">Tickets created</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-rose-600">Human Escalations</p>
            <Headset className="text-rose-600" size={20} />
          </div>
          <h3 className="mt-4 text-3xl font-bold text-rose-700">
            {escalatedTickets}
          </h3>
          <p className="mt-2 text-xs text-rose-500">
            Require human attention
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Weekly Activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <BarChart3 size={21} />
            </div>
            <div>
              <h3 className="font-bold">Weekly Activity</h3>
              <p className="text-xs text-slate-400">
                Actual conversations over the last 7 days
              </p>
            </div>
          </div>

          <div className="flex h-56 items-end justify-between gap-3">
            {weeklyData.map((item, index) => (
              <div
                key={`${item.day}-${index}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-medium text-slate-500">
                  {item.conversations}
                </span>
                <div
                  className="w-full max-w-12 rounded-t-lg bg-violet-500 transition-all hover:bg-violet-700"
                  style={{
                    height: `${(item.conversations / maxConversations) * 100}%`,
                    minHeight: item.conversations > 0 ? "4px" : "0px",
                  }}
                />
                <span className="text-xs text-slate-400">{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Language Distribution */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Globe size={21} />
            </div>
            <div>
              <h3 className="font-bold">Language Distribution</h3>
              <p className="text-xs text-slate-400">
                Actual conversations by detected language
              </p>
            </div>
          </div>

          {languageData.length === 0 ? (
            <p className="text-sm text-slate-400">
              No language data available yet.
            </p>
          ) : (
            <div className="space-y-6">
              {languageData.map((item, index) => (
                <div key={item.language}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{item.language}</span>
                    <span className="text-slate-500">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        languageColors[index % languageColors.length]
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Ticket Categories */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Ticket size={21} />
          </div>
          <div>
            <h3 className="font-bold">Ticket Categories</h3>
            <p className="text-xs text-slate-400">
              Distribution of customer support issues
            </p>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <p className="text-sm text-slate-400">
            No ticket category data available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryData.map((item) => (
              <div
                key={item.category}
                className="rounded-xl bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{item.category}</p>
                <h4 className="mt-2 text-2xl font-bold">{item.count}</h4>
                <p className="mt-1 text-xs text-slate-400">
                  {item.percentage}% of all tickets
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Performance */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <TrendingUp size={21} />
          </div>
          <div>
            <h3 className="font-bold">AI Performance</h3>
            <p className="text-xs text-slate-400">
              Current support ticket status overview
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Open Tickets</p>
            <h4 className="mt-2 text-2xl font-bold">{openTickets}</h4>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">In Progress</p>
            <h4 className="mt-2 text-2xl font-bold">{inProgressTickets}</h4>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Resolved Tickets</p>
            <h4 className="mt-2 text-2xl font-bold">{resolvedTickets}</h4>
          </div>

          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-sm text-rose-600">Escalated Tickets</p>
            <h4 className="mt-2 text-2xl font-bold text-rose-700">
              {escalatedTickets}
            </h4>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Response time and customer satisfaction are not yet measured.
        </p>
      </section>
    </div>
  );
}

export default Analytics;
