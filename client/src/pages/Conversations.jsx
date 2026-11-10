
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquare,
  Filter,
  X,
  CalendarDays,
  Languages,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Headset,
  RefreshCw,
  UserRound,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const STATUSES = ["Open", "In Progress", "Resolved", "Escalated"];

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
    case "open":
      return "bg-amber-50 text-amber-700";
    case "escalated":
      return "bg-rose-50 text-rose-700";
    case "in progress":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getInitials(name = "Guest") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "G"
  );
}

function formatTime(date) {
  if (!date) return "Unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unknown";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Conversations() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/conversations`,
        {
          credentials: "include",
        }
      );

      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load conversations."
        );
      }

      const records = Array.isArray(data.conversations)
        ? data.conversations
        : [];

      setConversations(records);

      // Keep an open details panel synchronized with refreshed data.
      setSelectedConversation((current) => {
        if (!current) return null;

        return (
          records.find((item) => item._id === current._id) || null
        );
      });
    } catch (err) {
      console.error("Conversation Fetch Error:", err);
      setError(err.message || "Unable to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Available languages
  const languages = useMemo(() => {
    return [
      ...new Set(
        conversations
          .map((item) => item.language)
          .filter(Boolean)
      ),
    ].sort();
  }, [conversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations
      .filter((conversation) => {
        const name = conversation.customerName || "Guest";
        const issue = conversation.category || "";
        const transcript = conversation.transcript || "";
        const response = conversation.response || "";
        const conversationId = conversation._id || "";

        const matchesSearch =
          !query ||
          name.toLowerCase().includes(query) ||
          issue.toLowerCase().includes(query) ||
          transcript.toLowerCase().includes(query) ||
          response.toLowerCase().includes(query) ||
          conversationId.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          conversation.status === statusFilter;

        const matchesLanguage =
          languageFilter === "All" ||
          conversation.language === languageFilter;

        return matchesSearch && matchesStatus && matchesLanguage;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [
    conversations,
    search,
    statusFilter,
    languageFilter,
  ]);

  // Statistics
  const counts = useMemo(
    () => ({
      total: conversations.length,
      open: conversations.filter(
        (item) => item.status === "Open"
      ).length,
      progress: conversations.filter(
        (item) => item.status === "In Progress"
      ).length,
      resolved: conversations.filter(
        (item) => item.status === "Resolved"
      ).length,
      escalated: conversations.filter(
        (item) => item.status === "Escalated"
      ).length,
    }),
    [conversations]
  );

  const statCards = [
    {
      title: "Total Conversations",
      value: counts.total,
      icon: MessageSquare,
      style: "bg-violet-50 text-violet-600",
    },
    {
      title: "Open",
      value: counts.open,
      icon: AlertCircle,
      style: "bg-amber-50 text-amber-600",
    },
    {
      title: "In Progress",
      value: counts.progress,
      icon: Clock,
      style: "bg-blue-50 text-blue-600",
    },
    {
      title: "Resolved",
      value: counts.resolved,
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Escalated",
      value: counts.escalated,
      icon: Headset,
      style: "bg-rose-50 text-rose-600",
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLanguageFilter("All");
  };

  const closeDetails = () => setSelectedConversation(null);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">
            Conversations
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage and monitor all your customer interactions.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                  {stat.title}
                </p>

                <div className={`rounded-xl p-2.5 ${stat.style}`}>
                  <Icon size={19} />
                </div>
              </div>

              <h3 className="mt-5 text-3xl font-bold">
                {loading ? "—" : stat.value.toLocaleString()}
              </h3>

              <p className="mt-2 text-xs text-slate-400">
                {loading ? "Loading..." : "Current database count"}
              </p>
            </div>
          );
        })}
      </section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-violet-600" />
          <h3 className="font-semibold">Search and Filter</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search customer, issue or transcript..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="All">All Languages</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Showing {filteredConversations.length} of{" "}
            {conversations.length} conversations
          </span>

          {(search ||
            statusFilter !== "All" ||
            languageFilter !== "All") && (
            <button
              onClick={clearFilters}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Conversations Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" />

          <h3 className="text-lg font-bold">
            All Conversations
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <RefreshCw
              size={18}
              className="animate-spin text-violet-600"
            />
            Loading conversations...
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <AlertCircle
              size={30}
              className="mx-auto mb-3 text-rose-400"
            />

            <p className="text-sm text-rose-600">{error}</p>

            <button
              onClick={fetchConversations}
              className="mt-3 text-sm font-semibold text-violet-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare
              size={32}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              No conversations found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="pb-4 font-medium">CUSTOMER</th>
                  <th className="pb-4 font-medium">ISSUE</th>
                  <th className="pb-4 font-medium">LANGUAGE</th>
                  <th className="pb-4 font-medium">PRIORITY</th>
                  <th className="pb-4 font-medium">STATUS</th>
                  <th className="pb-4 font-medium">TIME</th>
                </tr>
              </thead>

              <tbody>
                {filteredConversations.map((conversation) => {
                  const name = conversation.customerName || "Guest";

                  return (
                    <tr
                      key={conversation._id}
                      onClick={() =>
                        setSelectedConversation(conversation)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedConversation(conversation);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View conversation with ${name}`}
                      className={`cursor-pointer border-b border-slate-50 transition hover:bg-violet-50/50 focus:bg-violet-50/50 last:border-0 ${
                        conversation.status === "Escalated"
                          ? "bg-rose-50/40"
                          : ""
                      }`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-700">
                            {getInitials(name)}
                          </div>

                          <span className="text-sm font-semibold">
                            {name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {conversation.category || "General Inquiry"}
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {conversation.language || "Unknown"}
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {conversation.priority || "Normal"}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            conversation.status
                          )}`}
                        >
                          {conversation.status || "Unknown"}
                        </span>
                      </td>

                      <td className="py-4 text-sm text-slate-400">
                        {formatTime(conversation.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Conversation Details Panel */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close conversation details"
            onClick={closeDetails}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Conversation Details
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-800">
                  Customer Interaction
                </h3>
              </div>

              <button
                onClick={closeDetails}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Customer */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                  {getInitials(
                    selectedConversation.customerName || "Guest"
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {selectedConversation.customerName || "Guest"}
                  </h4>

                  <p className="text-sm text-slate-500">
                    Customer
                  </p>
                </div>
              </div>

              {/* Conversation Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Tag size={16} />
                    <span className="text-xs">Issue</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedConversation.category || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} />
                    <span className="text-xs">Priority</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedConversation.priority || "Normal"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Languages size={16} />
                    <span className="text-xs">Language</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedConversation.language || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <CalendarDays size={16} />
                    <span className="text-xs">Date</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {formatTime(selectedConversation.createdAt)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Conversation Status
                </h4>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    selectedConversation.status
                  )}`}
                >
                  {selectedConversation.status || "Unknown"}
                </span>

                <p className="mt-2 text-xs text-slate-400">
                  Manage status changes from Support Tickets.
                </p>
              </div>

              {/* Customer Transcript */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <UserRound size={17} className="text-violet-600" />
                  Customer Transcript
                </h4>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedConversation.transcript ||
                      "No transcript available."}
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <MessageSquare size={17} className="text-violet-600" />
                  AI Response
                </h4>

                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedConversation.response ||
                      "No AI response available."}
                  </p>
                </div>
              </div>

              {/* Order ID */}
              {selectedConversation.orderId && (
                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-800">
                    Order ID
                  </h4>

                  <p className="text-sm text-slate-600">
                    {selectedConversation.orderId}
                  </p>
                </div>
              )}

              {/* Conversation ID */}
              <div>
                <h4 className="mb-2 text-sm font-bold text-slate-800">
                  Conversation ID
                </h4>

                <p className="break-all text-xs text-slate-400">
                  {selectedConversation._id}
                </p>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="border-t border-slate-100 p-5">
              <button
                onClick={closeDetails}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Close Details
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Conversations;
