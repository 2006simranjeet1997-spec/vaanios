
import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  X,
  Settings,
  LogOut,
  MessageSquare,
  Ticket,
  LoaderCircle,
  CheckCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

function getInitials(name) {
  if (!name) return "VA";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Admin profile state
  const [admin, setAdmin] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  const pageNames = {
    "/": "Dashboard",
    "/conversations": "Conversations",
    "/voice-assistant": "Voice Assistant",
    "/tickets": "Support Tickets",
    "/analytics": "Analytics",
    "/settings": "Settings",
  };

  const currentPage = pageNames[location.pathname] || "Dashboard";

  const closeMenus = () => {
    setShowSearch(false);
    setShowNotifications(false);
    setShowProfile(false);
  };

  // ==========================================
  // FETCH LOGGED-IN ADMIN DETAILS
  // ==========================================

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to fetch admin details.");
        }

        const data = await response.json();

        setAdmin(data.admin || data.user || data);
      } catch (error) {
        console.error("Admin Profile Fetch Error:", error);
      }
    };

    fetchAdmin();
  }, []);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      const response = await fetch(`${API_URL}/api/notifications`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      const data = await response.json();

      setNotifications(getRecords(data, ["notifications"]));
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      console.error("Notification Fetch Error:", error);
      setNotificationError(error.message || "Failed to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // Fetch when component loads and refresh every 15 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ==========================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark notification as read.");
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Mark Notification Read Error:", error);
      setNotificationError(error.message);
    }
  };

  // ==========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark all notifications as read.");
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Mark All Read Error:", error);
      setNotificationError(error.message);
    }
  };

  // ==========================================
  // NOTIFICATION ICON
  // ==========================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "High Priority":
        return <AlertTriangle size={18} className="text-red-500" />;

      case "Escalation":
        return <AlertTriangle size={18} className="text-orange-500" />;

      case "Status Update":
        return <Clock size={18} className="text-blue-500" />;

      default:
        return <Ticket size={18} className="text-violet-600" />;
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  useEffect(() => {
    const query = searchText.trim();

    if (!showSearch || query.length < 2) {
      setResults([]);
      setSearchError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      try {
        const [conversationResponse, ticketResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/conversations`, {
              credentials: "include",
            }),
            fetch(`${API_URL}/api/tickets`, {
              credentials: "include",
            }),
          ]);

        if (!conversationResponse.ok || !ticketResponse.ok) {
          throw new Error("Unable to load search records.");
        }

        const [conversationData, ticketData] = await Promise.all([
          conversationResponse.json(),
          ticketResponse.json(),
        ]);

        const conversations = getRecords(conversationData, [
          "conversations",
          "results",
          "items",
        ]);

        const tickets = getRecords(ticketData, [
          "tickets",
          "results",
          "items",
        ]);

        const searchableRecords = [
          ...conversations.map((item) => ({
            ...item,
            recordType: "Conversation",
            route: "/conversations",
          })),
          ...tickets.map((item) => ({
            ...item,
            recordType: "Support Ticket",
            route: "/tickets",
          })),
        ];

        const normalizedQuery = query.toLowerCase();

        const matches = searchableRecords
          .filter((item) => {
            const searchableText = [
              item.customerName,
              item.orderId,
              item.category,
              item.description,
              item.transcript,
              item.status,
              item.priority,
              item._id,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchableText.includes(normalizedQuery);
          })
          .slice(0, 10);

        if (!cancelled) {
          setResults(matches);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchError(error.message || "Search failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText, showSearch]);

  const openResult = (item) => {
    closeMenus();
    setSearchText("");
    navigate(item.route);
  };

  // ==========================================
  // OPEN NOTIFICATION
  // ==========================================

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    closeMenus();

    if (notification.ticketId) {
      navigate("/tickets");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      setAdmin(null);
      closeMenus();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);
      alert(error.message || "Unable to logout. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const adminName = admin?.name || "Vaani Admin";
  const adminEmail = admin?.email || "Business account";

  return (
    <header className="relative flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <p className="text-sm text-slate-400">
          Workspace / {currentPage}
        </p>
        <h1 className="text-xl font-bold text-slate-800">
          {currentPage}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          onClick={() => {
            setShowSearch(!showSearch);
            setShowNotifications(false);
            setShowProfile(false);
          }}
          className="rounded-xl border border-slate-200 p-3 text-slate-500 hover:bg-slate-50"
          aria-label="Search"
        >
          {showSearch ? <X size={19} /> : <Search size={19} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            const nextState = !showNotifications;

            setShowNotifications(nextState);
            setShowSearch(false);
            setShowProfile(false);

            if (nextState) {
              fetchNotifications();
            }
          }}
          className="relative rounded-xl border border-slate-200 p-3 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={19} />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            setShowProfile(!showProfile);
            setShowSearch(false);
            setShowNotifications(false);
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 hover:bg-violet-200"
          aria-label="Profile"
        >
          {getInitials(admin?.name)}
        </button>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="absolute right-6 top-20 z-50 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
            <Search size={18} className="text-slate-400" />
            <input
              autoFocus
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search customers, orders, tickets..."
              className="w-full py-3 text-sm outline-none"
            />
            {loading && (
              <LoaderCircle
                size={18}
                className="animate-spin text-violet-600"
              />
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto">
            {searchText.trim().length < 2 && (
              <p className="p-3 text-sm text-slate-400">
                Enter at least 2 characters to search.
              </p>
            )}

            {searchError && (
              <p className="p-3 text-sm text-red-500">
                {searchError}
              </p>
            )}

            {!loading &&
              !searchError &&
              searchText.trim().length >= 2 &&
              results.length === 0 && (
                <p className="p-3 text-sm text-slate-500">
                  No matching records found.
                </p>
              )}

            {results.map((item, index) => (
              <button
                key={`${item.recordType}-${item._id || index}`}
                onClick={() => openResult(item)}
                className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
              >
                {item.recordType === "Conversation" ? (
                  <MessageSquare
                    size={18}
                    className="mt-1 text-violet-600"
                  />
                ) : (
                  <Ticket
                    size={18}
                    className="mt-1 text-violet-600"
                  />
                )}

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {item.customerName ||
                      item.orderId ||
                      item.category ||
                      item.recordType}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {item.description ||
                      item.transcript ||
                      item.category ||
                      "No description"}
                  </p>

                  <p className="mt-1 text-xs text-violet-600">
                    {item.recordType}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-16 top-20 z-50 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="font-semibold text-slate-800">
                Notifications
              </h3>
              <p className="text-xs text-slate-400">
                {unreadCount} unread notifications
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationLoading && notifications.length === 0 && (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-400">
                <LoaderCircle size={17} className="animate-spin" />
                Loading notifications...
              </div>
            )}

            {notificationError && (
              <p className="p-4 text-sm text-red-500">
                {notificationError}
              </p>
            )}

            {!notificationLoading &&
              !notificationError &&
              notifications.length === 0 && (
                <div className="p-6 text-center">
                  <Bell
                    size={28}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p className="text-sm font-medium text-slate-600">
                    You're all caught up!
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    New notifications will appear here.
                  </p>
                </div>
              )}

            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => openNotification(notification)}
                className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                  !notification.isRead ? "bg-violet-50/50" : "bg-white"
                }`}
              >
                <div className="mt-1 rounded-lg bg-slate-100 p-2">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {notification.title}
                    </p>

                    {!notification.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-400">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-3 text-center">
              <button
                onClick={() => {
                  closeMenus();
                  navigate("/tickets");
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                View Support Tickets
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile Panel */}
      {showProfile && (
        <div className="absolute right-6 top-20 z-50 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="border-b border-slate-100 p-3">
            <p className="font-semibold text-slate-800">
              {adminName}
            </p>
            <p className="break-all text-xs text-slate-400">
              {adminEmail}
            </p>
          </div>

          <button
            onClick={() => {
              closeMenus();
              navigate("/settings");
            }}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Settings size={17} />
            Settings
          </button>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoutLoading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <LogOut size={17} />
            )}
            {logoutLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
