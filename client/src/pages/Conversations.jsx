
import { useEffect, useState } from "react";
import {
  Search,
  MessageSquare,
  Filter,
  X,
  UserRound,
  CalendarDays,
  Languages,
  Tag,
  AlertCircle,
} from "lucide-react";

function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/conversations`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        // Temporary debugging log
        console.log("Fetched conversations:", data.conversations);

        if (!response.ok || !data.success) {
          throw new Error("Failed to load conversations.");
        }

        setConversations(data.conversations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((conversation) => {
    const name = conversation.customerName || "Guest";
    const issue = conversation.category || "";
    const transcript = conversation.transcript || "";
    const orderId = conversation.orderId || "";

    const query = search.toLowerCase().trim();

    const matchesSearch =
      name.toLowerCase().includes(query) ||
      issue.toLowerCase().includes(query) ||
      transcript.toLowerCase().includes(query) ||
      orderId.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || conversation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalConversations = conversations.length;

  const resolvedCount = conversations.filter(
    (item) => item.status === "Resolved"
  ).length;

  const openCount = conversations.filter(
    (item) => item.status === "Open"
  ).length;

  const getInitials = (name) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formatTime = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-700";
      case "Open":
        return "bg-amber-50 text-amber-700";
      case "Escalated":
        return "bg-rose-50 text-rose-700";
      case "In Progress":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold md:text-3xl">
          Conversations
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage and monitor all your customer interactions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Conversations</p>
          <h3 className="mt-3 text-3xl font-bold">
            {totalConversations}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Resolved</p>
          <h3 className="mt-3 text-3xl font-bold text-emerald-600">
            {resolvedCount}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Open</p>
          <h3 className="mt-3 text-3xl font-bold text-amber-500">
            {openCount}
          </h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by customer, order or issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Conversations Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" />
          <h3 className="text-lg font-bold">All Conversations</h3>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Loading conversations...
          </p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-rose-500">
            {error}
          </p>
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
                {filteredConversations.map((conversation) => {
                  const name = conversation.customerName || "Guest";

                  return (
                    <tr
                      key={conversation._id}
                      onClick={() =>
                        setSelectedConversation(conversation)
                      }
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedConversation(conversation);
                        }
                      }}
                      className="cursor-pointer border-b border-slate-50 last:border-0 transition hover:bg-violet-50/50 focus:bg-violet-50/50"
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
                        {conversation.category || "Unknown"}
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {conversation.language || "Unknown"}
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

                {filteredConversations.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-sm text-slate-400"
                    >
                      No conversations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Background Overlay */}
      {selectedConversation && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setSelectedConversation(null)}
        />
      )}

      {/* Right Side Details Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-lg transform bg-white shadow-2xl transition-transform duration-300 ${
          selectedConversation ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!selectedConversation}
      >
        {selectedConversation && (
          <div className="flex h-full flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Conversation Details
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">
                  Customer Interaction
                </h3>
              </div>

              <button
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close conversation details"
              >
                <X size={22} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Tag size={16} />
                    <span className="text-xs">Issue</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {selectedConversation.category || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} />
                    <span className="text-xs">Priority</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {selectedConversation.priority || "Normal"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Languages size={16} />
                    <span className="text-xs">Language</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {selectedConversation.language || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <CalendarDays size={16} />
                    <span className="text-xs">Date</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatTime(selectedConversation.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Status
                </h4>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    selectedConversation.status
                  )}`}
                >
                  {selectedConversation.status || "Unknown"}
                </span>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Customer Transcript
                </h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedConversation.transcript ||
                      "No transcript available."}
                  </p>
                </div>
              </div>

              {selectedConversation.response && (
                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-800">
                    AI Response
                  </h4>
                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedConversation.response}
                    </p>
                  </div>
                </div>
              )}

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
                onClick={() => setSelectedConversation(null)}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default Conversations;
