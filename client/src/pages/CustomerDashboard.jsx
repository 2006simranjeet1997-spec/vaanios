
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, ticketsRes, conversationsRes] = await Promise.all([
        fetch(`${API_URL}/api/customer/profile`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/customer/tickets`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/customer/conversations`, {
          credentials: "include",
        }),
      ]);

      if (
        profileRes.status === 401 ||
        ticketsRes.status === 401 ||
        conversationsRes.status === 401
      ) {
        navigate("/customer/login");
        return;
      }

      const [profileData, ticketsData, conversationsData] =
        await Promise.all([
          profileRes.json(),
          ticketsRes.json(),
          conversationsRes.json(),
        ]);

      if (!profileRes.ok) {
        throw new Error(profileData.message || "Could not load profile.");
      }

      if (!ticketsRes.ok) {
        throw new Error(ticketsData.message || "Could not load tickets.");
      }

      if (!conversationsRes.ok) {
        throw new Error(
          conversationsData.message || "Could not load conversations."
        );
      }

      setCustomer(profileData.customer || profileData);

      setTickets(
        Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData.tickets || []
      );

      setConversations(
        Array.isArray(conversationsData)
          ? conversationsData
          : conversationsData.conversations || []
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/api/customer-auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/customer/login");
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Open: "bg-blue-50 text-blue-700",
      "In Progress": "bg-amber-50 text-amber-700",
      Resolved: "bg-emerald-50 text-emerald-700",
      Escalated: "bg-red-50 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      Low: "bg-slate-100 text-slate-600",
      Normal: "bg-blue-50 text-blue-700",
      High: "bg-orange-50 text-orange-700",
      Urgent: "bg-red-50 text-red-700",
    };

    return styles[priority] || "bg-slate-100 text-slate-700";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
          <p className="text-sm font-medium text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-6 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === "Open").length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === "In Progress"
  ).length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === "Resolved"
  ).length;

  const stats = [
    {
      label: "Total Tickets",
      value: totalTickets,
      icon: "🎫",
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
    {
      label: "Open Tickets",
      value: openTickets,
      icon: "📩",
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "In Progress",
      value: inProgressTickets,
      icon: "⏳",
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "Resolved",
      value: resolvedTickets,
      icon: "✓",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
  ];

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentConversations = [...conversations]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/customer/dashboard">
            <h1 className="text-2xl font-bold tracking-tight">
              Vaani<span className="text-violet-700">OS</span>
            </h1>
            <p className="text-xs text-slate-500">Customer Portal</p>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {customer?.name || "Customer"}
              </p>
              <p className="text-xs text-slate-500">Customer Account</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* Welcome */}
        <section className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-violet-700">
              Customer Dashboard
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {customer?.name || "Customer"}!
            </h2>

            <p className="mt-2 text-slate-500">
              Your personal support centre. How can we help you today?
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-violet-300 hover:text-violet-700"
          >
            ↻ Refresh
          </button>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <div className={`grid h-10 w-10 place-items-center rounded-xl ${stat.bg} ${stat.color} font-bold`}>
                  {stat.icon}
                </div>
              </div>

              <p className={`mt-4 text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your support activity
              </p>
            </div>
          ))}
        </section>

        {/* Quick Actions */}
        <section className="mb-8 grid gap-5 md:grid-cols-2">
          <Link
            to="/customer/complaint"
            className="group flex min-h-48 flex-col justify-between rounded-2xl bg-gradient-to-r from-violet-700 to-purple-600 p-7 text-white shadow-sm transition hover:shadow-lg"
          >
            <div>
              <div className="mb-4 text-2xl">🎙️</div>
              <h3 className="text-xl font-bold">Raise a Complaint</h3>
              <p className="mt-2 max-w-sm text-sm text-violet-100">
                Tell VaaniOS about your issue using your voice or by typing.
              </p>
            </div>
            <p className="mt-5 text-sm font-bold">
              Get Support →
            </p>
          </Link>

          <Link
            to="/customer/tickets"
            className="group flex min-h-48 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-violet-300 hover:shadow-md"
          >
            <div>
              <div className="mb-4 text-2xl">🎫</div>
              <h3 className="text-xl font-bold">My Support Tickets</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Check your complaints, see their progress and track resolutions.
              </p>
            </div>
            <p className="mt-5 text-sm font-bold text-violet-700">
              View All Tickets →
            </p>
          </Link>
        </section>

        {/* Recent Tickets */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Recent Support Tickets</h3>
              <p className="mt-1 text-sm text-slate-500">
                Keep track of your latest complaints.
              </p>
            </div>

            <Link
              to="/customer/tickets"
              className="text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              View All →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-5 py-10 text-center">
              <p className="text-3xl">🎫</p>
              <p className="mt-3 font-semibold text-slate-800">
                No support tickets yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your submitted complaints will appear here.
              </p>
              <Link
                to="/customer/complaint"
                className="mt-4 inline-block text-sm font-bold text-violet-700 hover:underline"
              >
                Submit your first complaint →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTickets.map((ticket, index) => (
                <div
                  key={ticket._id || ticket.id || index}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {ticket.category || ticket.subject || "Support Request"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {ticket.description || "No description available."}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="text-slate-400">
                        {formatDate(ticket.createdAt)}
                      </span>

                      <span className={`rounded-full px-2.5 py-1 font-medium ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority || "Normal"} Priority
                      </span>
                    </div>
                  </div>

                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(ticket.status)}`}>
                    {ticket.status || "Open"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Conversations */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5">
            <h3 className="text-lg font-bold">Recent Conversations</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your previous interactions with VaaniOS.
            </p>
          </div>

          {recentConversations.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Your conversation history will appear here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentConversations.map((conversation, index) => (
                <div
                  key={conversation._id || index}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {conversation.category || "General Inquiry"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {conversation.language || "Language unavailable"} ·{" "}
                      {formatDate(conversation.createdAt)}
                    </p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(conversation.status)}`}>
                    {conversation.status || "Open"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Account Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5">
            <h3 className="text-lg font-bold">Account Information</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your registered account details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Full Name
              </p>
              <p className="mt-2 font-medium text-slate-800">
                {customer?.name || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email Address
              </p>
              <p className="mt-2 break-all font-medium text-slate-800">
                {customer?.email || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone Number
              </p>
              <p className="mt-2 font-medium text-slate-800">
                {customer?.phone || "Not available"}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} VaaniOS · Voice Intelligence
        </footer>

      </main>
    </div>
  );
}

export default CustomerDashboard;
