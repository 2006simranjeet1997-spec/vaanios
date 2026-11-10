
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  MessageCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Headphones,
  Send,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const statusStyles = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Escalated: "bg-red-100 text-red-700",
};

const priorityStyles = {
  Low: "bg-slate-100 text-slate-700",
  Normal: "bg-blue-100 text-blue-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function CustomerTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [expandedTicket, setExpandedTicket] = useState(null);

  // Live support chat states
  const [socket, setSocket] = useState(null);
  const [chatTicket, setChatTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState("");

  // Load customer tickets
  const loadTickets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/api/customer/tickets`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/customer/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load your tickets.");
      }

      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Connect customer to live support
  useEffect(() => {
    const connection = io(API_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: {
          role: "customer",
        },
      });

    setSocket(connection);

    connection.on("connect", () => {
      setChatError("");
    });

    connection.on("connect_error", (err) => {
      setChatError(err.message || "Could not connect to live support.");
    });

    // Receive messages
    connection.on("chat:message", (message) => {
      setChatMessages((current) => {
        if (current.some((item) => item._id === message._id)) {
          return current;
        }

        return [...current, message];
      });
    });

    // Update ticket when admin accepts request
    connection.on("human-support:assigned", (assignment) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === assignment.ticketId
            ? { ...ticket, ...assignment }
            : ticket
        )
      );

      setChatTicket((current) =>
        current?._id === assignment.ticketId
          ? { ...current, ...assignment }
          : current
      );
    });

    // Update ticket status
    connection.on("ticket:status", ({ ticketId, status }) => {
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status } : ticket
        )
      );

      setChatTicket((current) =>
        current?._id === ticketId
          ? { ...current, status }
          : current
      );
    });

    return () => {
      connection.disconnect();
    };
  }, []);

  // Open chat and load message history
  const openSupportChat = (ticket) => {
    if (!socket?.connected) {
      setChatError(
        "Live support is not connected. Please refresh and try again."
      );
      return;
    }

    if (!ticket.assignedAgentId && !ticket.assignedAgentName) {
      setChatError(
        "A support agent has not been assigned to this ticket yet."
      );
      return;
    }

    if (ticket.status === "Resolved") {
      setChatError(
        "This ticket is resolved. Chat is no longer available."
      );
      return;
    }

    setChatTicket(ticket);
    setChatMessages([]);
    setChatError("");
    setChatLoading(true);

    socket.emit("chat:join", ticket._id, (result) => {
      setChatLoading(false);

      if (!result?.success) {
        setChatError(
          result?.message || "Could not load chat history."
        );
        return;
      }

      setChatMessages(result.messages || []);
    });
  };

  // Send message to support agent
  const sendMessage = (event) => {
    event.preventDefault();

    const message = chatInput.trim();

    if (
      !message ||
      !chatTicket ||
      !socket?.connected ||
      sendingMessage ||
      chatTicket.status === "Resolved"
    ) {
      return;
    }

    setSendingMessage(true);

    socket.emit(
      "chat:send",
      {
        ticketId: chatTicket._id,
        message,
      },
      (result) => {
        setSendingMessage(false);

        if (!result?.success) {
          setChatError(
            result?.message || "Message could not be sent."
          );
          return;
        }

        setChatInput("");
        setChatError("");
      }
    );
  };

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(ticket._id || "").toLowerCase().includes(searchText) ||
        String(ticket.category || "").toLowerCase().includes(searchText) ||
        String(ticket.description || "").toLowerCase().includes(searchText) ||
        String(ticket.orderId || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  // Ticket counts
  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    progress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    escalated: tickets.filter((ticket) => ticket.status === "Escalated").length,
  }), [tickets]);

  const toggleTicket = (ticketId) => {
    setExpandedTicket((current) =>
      current === ticketId ? null : ticketId
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
  };

  const getConversation = (ticket) => {
    if (
      ticket.conversationId &&
      typeof ticket.conversationId === "object"
    ) {
      return ticket.conversationId;
    }

    return null;
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-violet-700"
          />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading your support tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              Vaani<span className="text-violet-700">OS</span>
            </h1>
            <p className="text-xs font-medium tracking-wider text-slate-500">
              CUSTOMER SUPPORT
            </p>
          </div>

          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-9">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
              Support centre
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              My Support Tickets
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Track your complaints and check their latest status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadTickets(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/customer/complaint"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              <MessageCircle size={17} />
              New Complaint
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <SummaryCard
            label="Total Tickets"
            value={counts.total}
            icon={Ticket}
            iconStyle="bg-violet-100 text-violet-700"
          />
          <SummaryCard
            label="Open"
            value={counts.open}
            icon={Clock}
            iconStyle="bg-blue-100 text-blue-700"
          />
          <SummaryCard
            label="In Progress"
            value={counts.progress}
            icon={RefreshCw}
            iconStyle="bg-amber-100 text-amber-700"
          />
          <SummaryCard
            label="Resolved"
            value={counts.resolved}
            icon={CheckCircle2}
            iconStyle="bg-emerald-100 text-emerald-700"
          />
          <SummaryCard
            label="Escalated"
            value={counts.escalated}
            icon={AlertTriangle}
            iconStyle="bg-red-100 text-red-700"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => loadTickets()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={17} className="text-violet-700" />
            <h3 className="font-bold">Find a ticket</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, order or complaint..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              <option value="All">All priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>

            {(search || statusFilter !== "All" || priorityFilter !== "All") && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-violet-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Ticket list */}
        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Your complaints</h3>
            <span className="text-xs text-slate-500">
              Latest tickets first
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Ticket size={30} />
              </div>

              <h3 className="mt-5 text-xl font-bold">
                {tickets.length === 0
                  ? "No tickets yet"
                  : "No matching tickets"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {tickets.length === 0
                  ? "You haven't submitted any complaints yet. If you need help, create your first support ticket."
                  : "Try changing your search or filters to find your ticket."}
              </p>

              {tickets.length === 0 ? (
                <Link
                  to="/customer/complaint"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  Submit a Complaint
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const isExpanded = expandedTicket === ticket._id;
                const conversation = getConversation(ticket);

                const hasAssignedAgent = Boolean(
                  ticket.assignedAgentId || ticket.assignedAgentName
                );

                const canChat =
                  hasAssignedAgent && ticket.status !== "Resolved";

                const isThisChatOpen =
                  chatTicket?._id === ticket._id;

                return (
                  <article
                    key={ticket._id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200"
                  >
                    {/* Ticket header */}
                    <button
                      type="button"
                      onClick={() => toggleTicket(ticket._id)}
                      className="w-full p-5 text-left sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <Ticket size={23} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900">
                                {ticket.category || "Support Request"}
                              </h4>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  statusStyles[ticket.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {ticket.status || "Open"}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {ticket.description || "No description available."}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays size={14} />
                                {formatDate(ticket.createdAt)}
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <FileText size={14} />
                                ID: {String(ticket._id || "").slice(-8)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              priorityStyles[ticket.priority] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {ticket.priority || "Normal"} Priority
                          </span>

                          <span className="text-slate-400">
                            {isExpanded ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded ticket details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
                        <h5 className="mb-4 font-bold text-slate-800">
                          Ticket details
                        </h5>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Detail
                            label="Ticket ID"
                            value={ticket._id || "Not available"}
                          />
                          <Detail
                            label="Order ID"
                            value={ticket.orderId || "Not provided"}
                          />
                          <Detail
                            label="Transaction ID"
                            value={ticket.transactionId || "Not provided"}
                          />
                          <Detail
                            label="Payment method"
                            value={ticket.paymentMethod || "Not provided"}
                          />
                          <Detail
                            label="Payment time"
                            value={ticket.paymentTime || "Not provided"}
                          />
                          <Detail
                            label="Requested action"
                            value={ticket.requestedAction || "Not specified"}
                          />
                        </div>

                        {/* Full complaint */}
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Full complaint
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {ticket.description || "No description available."}
                          </p>
                        </div>

                        {/* Escalation reason */}
                        {ticket.escalationReason && (
                          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                              <AlertTriangle size={17} />
                              Escalation reason
                            </p>
                            <p className="mt-2 text-sm leading-6 text-amber-900">
                              {ticket.escalationReason}
                            </p>
                          </div>
                        )}

                        {/* AI response */}
                        {conversation?.response && (
                          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                              <Headphones size={17} />
                              VaaniOS response
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-700">
                              {conversation.response}
                            </p>
                          </div>
                        )}

                        {/* Assigned support agent */}
                        {hasAssignedAgent && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-white p-2 text-emerald-700">
                                <Headphones size={20} />
                              </div>

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                  Your Support Agent
                                </p>
                                <p className="mt-1 font-bold text-emerald-900">
                                  {ticket.assignedAgentName || "Assigned agent"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Customer live chat */}
                        {canChat && (
                          <div className="mt-4">
                            {!isThisChatOpen ? (
                              <button
                                type="button"
                                onClick={() => openSupportChat(ticket)}
                                disabled={!socket?.connected}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <MessageCircle size={17} />
                                Chat with Support Agent
                              </button>
                            ) : (
                              <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
                                {/* Chat header */}
                                <div className="flex items-center justify-between bg-violet-700 px-4 py-3 text-white">
                                  <div>
                                    <p className="font-semibold">
                                      Live Support Chat
                                    </p>
                                    <p className="text-xs text-violet-100">
                                      {ticket.assignedAgentName || "Your support agent"}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatTicket(null);
                                      setChatMessages([]);
                                      setChatError("");
                                    }}
                                    className="rounded-lg p-1 hover:bg-violet-600"
                                    aria-label="Close chat"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                {/* Chat messages */}
                                <div className="max-h-80 min-h-36 space-y-3 overflow-y-auto bg-slate-50 p-4">
                                  {chatLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                                      <Loader2
                                        size={17}
                                        className="animate-spin"
                                      />
                                      Loading chat...
                                    </div>
                                  ) : chatMessages.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-slate-400">
                                      No messages yet. Send a message to your support agent.
                                    </p>
                                  ) : (
                                    chatMessages.map((message) => (
                                      <div
                                        key={message._id}
                                        className={`flex ${
                                          message.senderRole === "customer"
                                            ? "justify-end"
                                            : "justify-start"
                                        }`}
                                      >
                                        <div
                                          className={`max-w-[85%] rounded-xl px-3 py-2 ${
                                            message.senderRole === "customer"
                                              ? "bg-violet-700 text-white"
                                              : "bg-white text-slate-700 shadow-sm"
                                          }`}
                                        >
                                          <p className="mb-1 text-[10px] font-semibold opacity-70">
                                            {message.senderName ||
                                              (message.senderRole === "customer"
                                                ? "You"
                                                : "Support Agent")}
                                          </p>

                                          <p className="whitespace-pre-wrap break-words text-sm">
                                            {message.message}
                                          </p>

                                          {message.createdAt && (
                                            <p className="mt-1 text-right text-[10px] opacity-60">
                                              {formatDate(message.createdAt)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Chat error */}
                                {chatError && (
                                  <p className="px-4 pt-2 text-xs text-red-600">
                                    {chatError}
                                  </p>
                                )}

                                {/* Chat input */}
                                {ticket.status === "Resolved" ? (
                                  <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">
                                    This ticket has been resolved. Chat is closed.
                                  </p>
                                ) : (
                                  <form
                                    onSubmit={sendMessage}
                                    className="flex gap-2 border-t border-slate-100 p-3"
                                  >
                                    <input
                                      type="text"
                                      value={chatInput}
                                      onChange={(event) =>
                                        setChatInput(event.target.value)
                                      }
                                      maxLength={3000}
                                      placeholder="Write your message..."
                                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
                                    />

                                    <button
                                      type="submit"
                                      disabled={
                                        !chatInput.trim() ||
                                        sendingMessage ||
                                        !socket?.connected
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                                    >
                                      {sendingMessage ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Send size={16} />
                                      )}
                                      Send
                                    </button>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Waiting for agent */}
                        {!hasAssignedAgent &&
                          ticket.status === "Escalated" && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                                <Clock size={17} />
                                Waiting for a support agent
                              </p>
                              <p className="mt-1 text-sm text-amber-700">
                                Your request has been escalated. You can start chatting once an agent accepts it.
                              </p>
                            </div>
                          )}

                        {/* NEW: Need more help opens existing live chat */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            Last updated: {formatDate(ticket.updatedAt)}
                          </p>

                          {canChat ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isThisChatOpen) {
                                  setChatTicket(null);
                                  setChatMessages([]);
                                  setChatError("");
                                } else {
                                  openSupportChat(ticket);
                                }
                              }}
                              disabled={!socket?.connected}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline disabled:opacity-50"
                            >
                              {isThisChatOpen
                                ? "Close support chat"
                                : "Need more help? Chat now"}
                              <ArrowRight size={15} />
                            </button>
                          ) : ticket.status === "Resolved" ? (
                            <span className="text-sm text-slate-500">
                              This ticket is resolved.
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-amber-700">
                              Waiting for agent assignment
                            </span>
                          )}
                        </div>

                        {/* Show chat error when chat isn't open */}
                        {chatError && !isThisChatOpen && (
                          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {chatError}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer help */}
        <div className="mt-9 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-3 text-violet-700">
                <Headphones size={22} />
              </div>

              <div>
                <h4 className="font-bold text-slate-800">
                  Still need help?
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Submit another complaint through VaaniOS.
                </p>
              </div>
            </div>

            <Link
              to="/customer/complaint"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Contact Support
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={`rounded-lg p-2 ${iconStyle}`}>
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default CustomerTickets;
