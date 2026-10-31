
import { useState } from "react";
import { Search, MessageSquare, Filter } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Aarav Sharma",
    initials: "AS",
    issue: "Order delivery delay",
    language: "Hinglish",
    status: "Resolved",
    time: "2 min ago",
  },
  {
    id: 2,
    name: "Priya Mehta",
    initials: "PM",
    issue: "Refund request",
    language: "Hindi",
    status: "Pending",
    time: "8 min ago",
  },
  {
    id: 3,
    name: "Rahul Verma",
    initials: "RV",
    issue: "Product information",
    language: "English",
    status: "Resolved",
    time: "15 min ago",
  },
  {
    id: 4,
    name: "Simran Kaur",
    initials: "SK",
    issue: "Payment issue",
    language: "Punjabi",
    status: "Escalated",
    time: "24 min ago",
  },
  {
    id: 5,
    name: "Ananya Singh",
    initials: "AS",
    issue: "Cancellation request",
    language: "Hindi",
    status: "Pending",
    time: "35 min ago",
  },
];

function Conversations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      conversation.name.toLowerCase().includes(search.toLowerCase()) ||
      conversation.issue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || conversation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <h3 className="mt-3 text-3xl font-bold">1,284</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Resolved</p>
          <h3 className="mt-3 text-3xl font-bold text-emerald-600">946</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <h3 className="mt-3 text-3xl font-bold text-amber-500">38</h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by customer or issue..."
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
            <option value="Resolved">Resolved</option>
            <option value="Pending">Pending</option>
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
              {filteredConversations.map((conversation) => (
                <tr
                  key={conversation.id}
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
      </section>

    </div>
  );
}

export default Conversations;
