
import { useEffect, useState } from "react";
import {
  Building2,
  Bot,
  Bell,
  User,
  Save,
  CheckCircle,
  LoaderCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

const defaultSettings = {
  businessName: "Vaani Admin",
  assistantName: "Vaani Assistant",
  language: "English",
  voice: "Nalini",
  newTicket: true,
  highPriority: true,
  escalation: true,
  statusUpdate: true,
};

function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [admin, setAdmin] = useState(null);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // LOAD SETTINGS AND ADMIN INFORMATION
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const settingsResponse = await fetch(
          `${API_URL}/api/settings`,
          { credentials: "include" }
        );

        const settingsData = await settingsResponse.json();

        if (!settingsResponse.ok || !settingsData.success) {
          throw new Error(
            settingsData.message || "Could not load settings."
          );
        }

        const savedSettings = settingsData.settings || {};
        const preferences =
          savedSettings.notificationPreferences || {};

        setSettings({
          businessName:
            savedSettings.businessName || defaultSettings.businessName,
          assistantName:
            savedSettings.assistantName || defaultSettings.assistantName,
          language:
            savedSettings.language || defaultSettings.language,
          voice:
            savedSettings.voice || defaultSettings.voice,
          newTicket: preferences.newTicket ?? true,
          highPriority: preferences.highPriority ?? true,
          escalation: preferences.escalation ?? true,
          statusUpdate: preferences.statusUpdate ?? true,
        });

        const adminResponse = await fetch(
          `${API_URL}/api/auth/me`,
          { credentials: "include" }
        );

        if (!adminResponse.ok) {
          throw new Error("Could not load account information.");
        }

        const adminData = await adminResponse.json();

        setAdmin(
          adminData.admin || adminData.user || adminData
        );
      } catch (err) {
        console.error("Settings Loading Error:", err);
        setError(
          err.message || "Could not load your settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // UPDATE INDIVIDUAL SETTING
  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  };

  // SAVE ALL SETTINGS TO MONGODB
  const saveSettings = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: settings.businessName,
          assistantName: settings.assistantName,
          language: settings.language,
          voice: settings.voice,
          notificationPreferences: {
            newTicket: settings.newTicket,
            highPriority: settings.highPriority,
            escalation: settings.escalation,
            statusUpdate: settings.statusUpdate,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save settings."
        );
      }

      const savedSettings = data.settings || {};
      const preferences =
        savedSettings.notificationPreferences || {};

      setSettings({
        businessName: savedSettings.businessName,
        assistantName: savedSettings.assistantName,
        language: savedSettings.language,
        voice: savedSettings.voice,
        newTicket: preferences.newTicket,
        highPriority: preferences.highPriority,
        escalation: preferences.escalation,
        statusUpdate: preferences.statusUpdate,
      });

      setSaved(true);
    } catch (err) {
      console.error("Settings Save Error:", err);
      setError(
        err.message || "Could not save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // NOTIFICATION SECTIONS
  const sections = [
    { title: "New Support Tickets", key: "newTicket" },
    { title: "High Priority Complaints", key: "highPriority" },
    { title: "Complaint Escalations", key: "escalation" },
    { title: "Ticket Status Updates", key: "statusUpdate" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-slate-500">
        <LoaderCircle
          size={22}
          className="animate-spin text-violet-600"
        />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* PAGE HEADING */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your VaaniOS workspace and assistant preferences.
        </p>
      </div>

      {/* BUSINESS PROFILE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <Building2 size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Business Profile
            </h3>
            <p className="text-sm text-slate-400">
              Configure your workspace details.
            </p>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-600">
          Business Name
        </label>

        <input
          value={settings.businessName}
          onChange={(e) =>
            updateSetting("businessName", e.target.value)
          }
          maxLength={100}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
        />
      </section>

      {/* AI ASSISTANT SETTINGS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <Bot size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              AI Assistant Settings
            </h3>
            <p className="text-sm text-slate-400">
              Configure your assistant's preferences.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Assistant Name
            </label>
            <input
              value={settings.assistantName}
              onChange={(e) =>
                updateSetting("assistantName", e.target.value)
              }
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Default Language
            </label>
            <select
              value={settings.language}
              onChange={(e) =>
                updateSetting("language", e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Punjabi</option>
              <option>Hinglish</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Default Voice
            </label>
            <select
              value={settings.voice}
              onChange={(e) =>
                updateSetting("voice", e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500"
            >
              <option>Nalini</option>
              <option>Male</option>
            </select>
          </div>
        </div>
      </section>

      {/* NOTIFICATION PREFERENCES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <Bell size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Notification Preferences
            </h3>
            <p className="text-sm text-slate-400">
              Choose which notifications you want to enable.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sections.map((section) => (
            <div
              key={section.key}
              className="flex items-center justify-between py-4"
            >
              <span className="text-sm font-medium text-slate-700">
                {section.title}
              </span>

              <button
                type="button"
                role="switch"
                aria-label={section.title}
                aria-checked={settings[section.key]}
                onClick={() =>
                  updateSetting(
                    section.key,
                    !settings[section.key]
                  )
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  settings[section.key]
                    ? "bg-violet-600"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    settings[section.key]
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ACCOUNT INFORMATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <User size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Account Information
            </h3>
            <p className="text-sm text-slate-400">
              Current workspace account.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Account: {admin?.name || "Vaani Admin"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Email: {admin?.email || "Not available"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Account Type: Business
        </p>
      </section>

      {/* SAVE CHANGES */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {saved && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={17} />
              Settings saved successfully.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="ml-auto flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default Settings;
