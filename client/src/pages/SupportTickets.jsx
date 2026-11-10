import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headset,
  X,
  CalendarDays,
  Tag,
  AlertTriangle,
  Package,
  FileText,
  RefreshCw,
  Filter,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const STATUSES = ["Open", "In Progress", "Resolved", "Escalated"];

function getTicketId(id = "") {
  return `TKT-${String(id).slice(-6).toUpperCase()}`;
}

function formatDate(date) {
  if (!date) return "Unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unknown";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-amber-50 text-amber-700";
    case "in progress":
      return "bg-blue-50 text-blue-700";
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
    case "escalated":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPriorityStyle(priority) {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-rose-100 text-rose-700";
    case "high":
      return "bg-orange-50 text-orange-700";
    case "normal":
      return "bg-amber-50 text-amber-700";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function SupportTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [humanRequests, setHumanRequests] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [chatTicket, setChatTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/tickets`, {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load support tickets.");
      }

      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch escalated requests waiting for a human agent.
  const fetchHumanRequests = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/human-support/requests`,
        { credentials: "include" }
      );

      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load human-support requests.");
      }

      setHumanRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setActionError(err.message || "Could not load human-support requests.");
    }
  }, [navigate]);

  useEffect(() => {
    fetchHumanRequests();
  }, [fetchHumanRequests]);

  // Connect the authenticated admin to Socket.IO.
  useEffect(() => {
    const connection = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        role: "admin",
      },
    });

    setSocket(connection);

    connection.on("connect", () => {
      setChatError("");
    });

    connection.on("connect_error", (err) => {
      setChatError(err.message || "Live support connection failed.");
    });

    connection.on("human-support:requested", () => {
      fetchHumanRequests();
      fetchTickets();
    });

    connection.on("human-support:accepted", () => {
      fetchHumanRequests();
      fetchTickets();
    });

    connection.on("ticket:status", ({ ticketId, status }) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status } : ticket
        )
      );

      setSelectedTicket((current) =>
        current?._id === ticketId ? { ...current, status } : current
      );
    });

    connection.on("chat:message", (message) => {
      setChatMessages((current) => {
        if (current.some((item) => item._id === message._id)) return current;
        return [...current, message];
      });
    });

    connection.on("human-support:assigned", (assignment) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === assignment.ticketId
            ? { ...ticket, ...assignment }
            : ticket
        )
      );

      setSelectedTicket((current) =>
        current?._id === assignment.ticketId
          ? { ...current, ...assignment }
          : current
      );
    });

    return () => connection.disconnect();
  }, [fetchHumanRequests, fetchTickets]);

  const acceptHumanRequest = (ticket) => {
    if (!socket?.connected) {
      setActionError("Live support is not connected. Refresh and try again.");
      return;
    }

    setAcceptingId(ticket._id);
    setActionError("");

    socket.emit("human-support:accept", ticket._id, (result) => {
      setAcceptingId(null);

      if (!result?.success) {
        setActionError(result?.message || "Could not accept this request.");
        fetchHumanRequests();
        return;
      }

      setSelectedTicket({
        ...ticket,
        status: "In Progress",
      });

      fetchHumanRequests();
      fetchTickets();
    });
  };

  const openHumanChat = (ticket) => {
    if (!socket?.connected) {
      setChatError("Live support is not connected. Refresh and try again.");
      return;
    }

    setChatTicket(ticket);
    setChatMessages([]);
    setChatError("");
    setChatLoading(true);

    socket.emit("chat:join", ticket._id, (result) => {
      setChatLoading(false);

      if (!result?.success) {
        setChatError(result?.message || "Could not open this chat.");
        return;
      }

      setChatMessages(result.messages || []);
    });
  };
  const sendHumanChatMessage = (event) => {
    event.preventDefault();

    const message = chatInput.trim();
    if (!message || !chatTicket || !socket?.connected || sendingMessage) return;

    setSendingMessage(true);

    socket.emit(
      "chat:send",
      { ticketId: chatTicket._id, message },
      (result) => {
        setSendingMessage(false);

        if (!result?.success) {
          setChatError(result?.message || "Message could not be sent.");
          return;
        }

        setChatInput("");
        setChatError("");
      }
    );
  };

  // Update ticket status
  const updateStatus = async (id, newStatus) => {
    if (!STATUSES.includes(newStatus)) return;

    setUpdatingId(id);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/tickets/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update ticket.");
      }

      const updatedTicket = data.ticket;

      if (!updatedTicket) {
        throw new Error("The server did not return the updated ticket.");
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === id
            ? { ...ticket, ...updatedTicket }
            : ticket
        )
      );

      setSelectedTicket((current) =>
        current?._id === id
          ? { ...current, ...updatedTicket }
          : current
      );

      fetchHumanRequests();
    } catch (err) {
      setActionError(err.message || "Could not update ticket.");
      fetchTickets();
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter tickets
  const filteredTickets = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const customer = ticket.customerName || "Guest";
      const ticketId = getTicketId(ticket._id);

      const matchesSearch =
        !searchTerm ||
        customer.toLowerCase().includes(searchTerm) ||
        ticketId.toLowerCase().includes(searchTerm) ||
        (ticket.category || "").toLowerCase().includes(searchTerm) ||
        (ticket.description || "").toLowerCase().includes(searchTerm) ||
        (ticket.orderId || "").toLowerCase().includes(searchTerm) ||
        (ticket.escalationReason || "").toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  // Statistics
  const counts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      progress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      escalated: tickets.filter((t) => t.status === "Escalated").length,
    }),
    [tickets]
  );

  const closeDetails = () => setSelectedTicket(null);

  const statCards = [
    {
      title: "Total Tickets",
      value: counts.total,
      icon: Ticket,
      style: "bg-violet-50 text-violet-600",
    },
    {
      title: "Open Tickets",
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

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">
            Support Tickets
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Track and manage customer support requests generated by VaaniOS AI.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Tickets
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
                <p className="text-sm text-slate-500">{stat.title}</p>
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

      {/* Human Support Queue */}
      <section className="rounded-2xl border border-rose-100 bg-white p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Headset size={19} className="text-rose-600" />
              Human Support Requests
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Escalated tickets waiting for an admin to accept.
            </p>
          </div>

          <button
            onClick={fetchHumanRequests}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh queue
          </button>
        </div>

        {humanRequests.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
            No pending human-support requests.
          </p>
        ) : (
          <div className="grid gap-3">
            {humanRequests.map((request) => (
              <div
                key={request._id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {request.customerName || "Customer"}
                    </span>

                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      {request.priority || "Normal"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {getTicketId(request._id)} · {request.category || "General"}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {request.escalationReason || request.description || "Customer requested human support."}
                  </p>
                </div>

                <button
                  onClick={() => acceptHumanRequest(request)}
                  disabled={acceptingId === request._id || !socket?.connected}
                  className="shrink-0 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acceptingId === request._id ? "Accepting..." : "Accept Request"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action Error */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{actionError}</p>

          <button
            onClick={() => setActionError("")}
            className="text-rose-500"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}
            {/* Search and Filters */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-violet-600" />
          <h3 className="font-semibold">Search and Filter Tickets</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search tickets, customers, orders..."
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
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>

          {(search || statusFilter !== "All" || priorityFilter !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPriorityFilter("All");
              }}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Tickets Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">All Support Tickets</h3>
            <p className="mt-1 text-sm text-slate-400">
              Select a ticket to view its complete details.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <RefreshCw size={18} className="animate-spin text-violet-600" />
            Loading support tickets...
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <AlertCircle size={30} className="mx-auto mb-3 text-rose-400" />
            <p className="text-sm text-rose-600">{error}</p>

            <button
              onClick={fetchTickets}
              className="mt-3 text-sm font-semibold text-violet-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No tickets found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
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
                    onClick={() => setSelectedTicket(ticket)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedTicket(ticket);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ticket ${getTicketId(ticket._id)}`}
                    className={`cursor-pointer border-b border-slate-50 transition hover:bg-violet-50/50 last:border-0 focus:bg-violet-50 ${
                      ticket.status === "Escalated" ? "bg-rose-50/50" : ""
                    }`}
                  >
                    <td className="py-4 text-sm font-semibold text-violet-600">
                      {getTicketId(ticket._id)}
                    </td>

                    <td className="py-4 text-sm font-medium">
                      {ticket.customerName || "Guest"}
                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {ticket.category || "General Inquiry"}
                    </td>

                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority || "Normal"}
                      </span>
                    </td>

                    <td
                      className="py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={ticket.status || "Open"}
                        disabled={updatingId === ticket._id}
                        onChange={(e) =>
                          updateStatus(ticket._id, e.target.value)
                        }
                        className={`rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium outline-none focus:border-violet-500 disabled:opacity-50 ${getStatusStyle(ticket.status)}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingId === ticket._id && (
                        <span className="ml-2 text-xs text-slate-400">
                          Saving...
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-sm text-slate-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ticket Details Side Panel */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close ticket details"
            onClick={closeDetails}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Ticket Details
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-800">
                  {getTicketId(selectedTicket._id)}
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
                  {(selectedTicket.customerName || "Guest")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h4 className="font-bold text-slate-800">
                    {selectedTicket.customerName || "Guest"}
                  </h4>
                  <p className="text-sm text-slate-500">Customer</p>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Tag size={16} />
                    <span className="text-xs">Issue</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {selectedTicket.category || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <AlertTriangle size={16} />
                    <span className="text-xs">Priority</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {selectedTicket.priority || "Normal"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Package size={16} />
                    <span className="text-xs">Order ID</span>
                  </div>
                  <p className="break-all font-semibold text-slate-800">
                    {selectedTicket.orderId || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <CalendarDays size={16} />
                    <span className="text-xs">Created</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>
                            {/* Status Update */}
                            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Update Ticket Status
                </label>

                <select
                  value={selectedTicket.status || "Open"}
                  disabled={updatingId === selectedTicket._id}
                  onChange={(e) =>
                    updateStatus(selectedTicket._id, e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:opacity-50"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {updatingId === selectedTicket._id && (
                  <p className="mt-2 text-xs text-slate-400">
                    Updating ticket...
                  </p>
                )}
              </div>

              {/* Assigned Agent */}
              {selectedTicket.assignedAgentName && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Assigned Support Agent
                  </p>
                  <p className="mt-1 font-semibold text-emerald-900">
                    {selectedTicket.assignedAgentName}
                  </p>
                </div>
              )}

              {(selectedTicket.status === "In Progress" ||
                selectedTicket.status === "Escalated") && (
                <button
                  onClick={() => openHumanChat(selectedTicket)}
                  className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Open Live Customer Chat
                </button>
              )}

              {chatTicket?._id === selectedTicket._id && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Live Support Chat
                      </p>
                      <p className="text-xs text-slate-500">
                        {chatTicket.customerName || "Customer"} · {getTicketId(chatTicket._id)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setChatTicket(null);
                        setChatMessages([]);
                        setChatError("");
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-200"
                      aria-label="Close chat"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="max-h-72 min-h-32 space-y-3 overflow-y-auto bg-white p-4">
                    {chatLoading ? (
                      <p className="text-center text-sm text-slate-400">
                        Loading messages...
                      </p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-center text-sm text-slate-400">
                        No messages yet. Start the conversation.
                      </p>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${
                            message.senderRole === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 ${
                              message.senderRole === "admin"
                                ? "bg-violet-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <p className="mb-1 text-[10px] font-semibold opacity-70">
                              {message.senderName || message.senderRole}
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {chatError && (
                    <p className="px-4 pb-2 text-xs text-rose-600">
                      {chatError}
                    </p>
                  )}

                  <form
                    onSubmit={sendHumanChatMessage}
                    className="flex gap-2 border-t border-slate-100 p-3"
                  >
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      maxLength={3000}
                      placeholder="Type a reply..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />

                    <button
                      type="submit"
                      disabled={
                        !chatInput.trim() ||
                        sendingMessage ||
                        !socket?.connected
                      }
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {sendingMessage ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              )}

              {/* Complaint */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <FileText size={17} className="text-violet-600" />
                  Customer Complaint
                </h4>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedTicket.description || "No description available."}
                </div>
              </div>

              {/* Requested Action */}
              <div>
                <h4 className="mb-3 font-semibold text-slate-800">
                  Requested Action
                </h4>

                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedTicket.requestedAction || "No action specified."}
                </div>
              </div>

              {/* Payment Information */}
              {(selectedTicket.transactionId ||
                selectedTicket.paymentMethod ||
                selectedTicket.paymentTime) && (
                <div>
                  <h4 className="mb-3 font-semibold text-slate-800">
                    Payment Information
                  </h4>

                  <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                    <p>
                      <span className="text-slate-400">Transaction ID: </span>
                      {selectedTicket.transactionId || "Not provided"}
                    </p>
                    <p>
                      <span className="text-slate-400">Payment Method: </span>
                      {selectedTicket.paymentMethod || "Not provided"}
                    </p>
                    <p>
                      <span className="text-slate-400">Payment Time: </span>
                      {selectedTicket.paymentTime || "Not provided"}
                    </p>
                  </div>
                </div>
              )}

              {/* Escalation */}
              {selectedTicket.escalationReason && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-rose-700">
                    <Headset size={17} />
                    Escalation Reason
                  </h4>

                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                    {selectedTicket.escalationReason}
                  </div>
                </div>
              )}

              {/* Linked Conversation */}
              {selectedTicket.conversationId && (
                <div>
                  <h4 className="mb-2 font-semibold text-slate-800">
                    Linked Conversation
                  </h4>

                  <p className="break-all rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                    {typeof selectedTicket.conversationId === "object"
                      ? selectedTicket.conversationId._id
                      : selectedTicket.conversationId}
                  </p>

                  {typeof selectedTicket.conversationId === "object" &&
                    selectedTicket.conversationId.response && (
                      <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
                        <p className="mb-2 text-xs font-semibold text-violet-700">
                          AI RESPONSE
                        </p>
                        <p className="text-sm leading-6 text-slate-700">
                          {selectedTicket.conversationId.response}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-slate-100 p-5">
              <button
                onClick={closeDetails}
                className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
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

export default SupportTickets;