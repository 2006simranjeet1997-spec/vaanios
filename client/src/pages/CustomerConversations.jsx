
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function CustomerConversations() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/customer/conversations`,
          { credentials: "include" }
        );

        if (response.status === 401) {
          navigate("/customer/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load conversations.");
        }

        setConversations(data.conversations || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [navigate]);

  const getStatusStyle = (status) => {
    const styles = {
      Open: "bg-blue-50 text-blue-700",
      "In Progress": "bg-amber-50 text-amber-700",
      Resolved: "bg-green-50 text-green-700",
      Escalated: "bg-red-50 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getPriorityStyle = (priority) => {
    if (priority === "High" || priority === "Critical") {
      return "bg-orange-50 text-orange-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Conversation History
            </h1>
            <p className="mt-2 text-slate-500">
              View your previous conversations with VaaniOS AI.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/customer/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-700"
            >
              Dashboard
            </Link>

            <Link
              to="/customer/complaint"
              className="rounded-xl bg-violet-700 px-5 py-3 text-white hover:bg-violet-800"
            >
              New Complaint
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Total conversations
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {conversations.length}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
            Loading your conversations...
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-5 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No conversations yet
            </h2>
            <p className="mt-2 text-slate-500">
              Your conversations with our AI assistant will appear here.
            </p>
            <Link
              to="/customer/complaint"
              className="mt-6 inline-block rounded-xl bg-violet-700 px-6 py-3 text-white"
            >
              Submit a Complaint
            </Link>
          </div>
        )}

        {!loading && !error && conversations.map((conversation) => (
          <div
            key={conversation._id}
            className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Conversation ID: {conversation._id}
                </p>

                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {conversation.category || "General Inquiry"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {conversation.createdAt
                    ? new Date(conversation.createdAt).toLocaleString()
                    : "Date unavailable"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-sm ${getStatusStyle(conversation.status)}`}>
                  {conversation.status || "Open"}
                </span>

                <span className={`rounded-full px-3 py-1 text-sm ${getPriorityStyle(conversation.priority)}`}>
                  {conversation.priority || "Normal"} Priority
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-slate-100" />

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-500">
                Your conversation
              </p>
              <p className="whitespace-pre-wrap leading-7 text-slate-700">
                {conversation.transcript || "No transcript available."}
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-violet-50 p-5">
              <p className="mb-2 text-sm font-semibold text-violet-800">
                VaaniOS AI Response
              </p>
              <p className="whitespace-pre-wrap leading-7 text-slate-700">
                {conversation.response || "No AI response available."}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
              <span>
                Language: {conversation.language || "Unknown"}
              </span>
              <span>
                Category: {conversation.category || "General Inquiry"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomerConversations;
