
import { useState } from "react";
import {
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

const initialTickets = [
  {
    id: "TKT-001",
    customer: "Priya Mehta",
    issue: "Refund not received",
    priority: "High",
    status: "Open",
    date: "Today, 10:30 AM",
  },
  {
    id: "TKT-002",
    customer: "Simran Kaur",
    issue: "Payment failure",
    priority: "High",
    status: "In Progress",
    date: "Today, 09:45 AM",
  },
  {
    id: "TKT-003",
    customer: "Aarav Sharma",
    issue: "Order delivery delay",
    priority: "Medium",
    status: "Resolved",
    date: "Yesterday",
  },
  {
    id: "TKT-004",
    customer: "Rahul Verma",
    issue: "Product information",
    priority: "Low",
    status: "Open",
    date: "Yesterday",
  },
  {
    id: "TKT-005",
    customer: "Ananya Singh",
    issue: "Order cancellation",
    priority: "Medium",
    status: "In Progress",
    date: "Yesterday",
  },
];

function SupportTickets() {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.customer.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id, newStatus) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status: newStatus } : ticket
      )
    );
  };

  const openCount = tickets.filter((ticket) => ticket.status === "Open").length;
  const progressCount = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  return (
    <div className="space-y-6 text-slate-800">

      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Support Tickets</h2>
          <p className="mt-2 text-sm text-slate-500">
            Track and manage customer support requests.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700">
          <Plus size={18} />
          Create Ticket
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Open Tickets</p>
            <AlertCircle className="text-rose-500" size={20} />
          </div>
          <h3 className="mt-3 text-3xl font-bold">{openCount}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">In Progress</p>
            <Clock className="text-amber-500" size={20} />
          </div>
          <h3 className="mt-3 text-3xl font-bold">{progressCount}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Resolved Tickets</p>
            <CheckCircle2 className="text-emerald-500" size={20} />
          </div>
          <h3 className="mt-3 text-3xl font-bold">{resolvedCount}</h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search tickets, customers or issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Tickets Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Ticket size={20} className="text-violet-600" />
          <h3 className="text-lg font-bold">All Support Tickets</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="pb-4 font-medium">TICKET ID</th>
                <th className="pb-4 font-medium">CUSTOMER</th>
                <th className="pb-4 font-medium">ISSUE</th>
                <th className="pb-4 font-medium">PRIORITY</th>
                <th className="pb-4 font-medium">STATUS</th>
                <th className="pb-4 font-medium">DATE</th>
              </tr>
            </thead>

            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-4 text-sm font-semibold text-violet-600">
                    {ticket.id}
                  </td>

                  <td className="py-4 text-sm font-medium">
                    {ticket.customer}
                  </td>

                  <td className="py-4 text-sm text-slate-500">
                    {ticket.issue}
                  </td>

                  <td className="py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        ticket.priority === "High"
                          ? "bg-rose-50 text-rose-600"
                          : ticket.priority === "Medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>

                  <td className="py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-violet-500"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </td>

                  <td className="py-4 text-sm text-slate-400">
                    {ticket.date}
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-slate-400">
                    No tickets found.
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

export default SupportTickets;
