
import { useEffect, useState } from "react";
import {
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/tickets");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Failed to load support tickets.");
        }

        setTickets(data.tickets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const customer = ticket.customerName || "Guest";
    const issue = ticket.category || "";
    const ticketId = `TKT-${ticket._id.slice(-6).toUpperCase()}`;

    const matchesSearch =
      customer.toLowerCase().includes(search.toLowerCase()) ||
      ticketId.toLowerCase().includes(search.toLowerCase()) ||
      issue.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  
const updateStatus = async (id, newStatus) => {
  try {
    const response = await fetch(
      `http://localhost:5001/api/tickets/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update ticket.");
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket._id === id
          ? { ...ticket, status: data.ticket.status }
          : ticket
      )
    );

  } catch (error) {
    alert(error.message);
  }
};


  const openCount = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const progressCount = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

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

        <button
          disabled
          title="Ticket creation will be enabled in a later step."
          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-violet-400 px-5 py-3 text-sm font-semibold text-white opacity-70"
        >
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
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {/* Tickets Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Ticket size={20} className="text-violet-600" />
          <h3 className="text-lg font-bold">All Support Tickets</h3>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Loading support tickets...
          </p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-rose-500">
            {error}
          </p>
        ) : (
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
                  <tr
                    key={ticket._id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 text-sm font-semibold text-violet-600">
                      TKT-{ticket._id.slice(-6).toUpperCase()}
                    </td>

                    <td className="py-4 text-sm font-medium">
                      {ticket.customerName || "Guest"}
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {ticket.category}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          ticket.priority === "High" ||
                          ticket.priority === "Urgent"
                            ? "bg-rose-50 text-rose-600"
                            : ticket.priority === "Normal"
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
                        onChange={(e) =>
                          updateStatus(ticket._id, e.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-violet-500"
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Escalated</option>
                      </select>
                    </td>

                    <td className="py-4 text-sm text-slate-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-sm text-slate-400"
                    >
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SupportTickets;
