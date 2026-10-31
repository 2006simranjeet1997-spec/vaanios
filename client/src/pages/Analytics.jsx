
import {
    BarChart3,
    TrendingUp,
    MessageSquare,
    CheckCircle2,
    Clock,
    Globe,
  } from "lucide-react";
  
  const languageData = [
    { language: "Hindi", percentage: 45, color: "bg-violet-600" },
    { language: "English", percentage: 30, color: "bg-indigo-500" },
    { language: "Hinglish", percentage: 18, color: "bg-fuchsia-500" },
    { language: "Punjabi", percentage: 7, color: "bg-amber-500" },
  ];
  
  const weeklyData = [
    { day: "Mon", conversations: 45 },
    { day: "Tue", conversations: 65 },
    { day: "Wed", conversations: 52 },
    { day: "Thu", conversations: 85 },
    { day: "Fri", conversations: 72 },
    { day: "Sat", conversations: 95 },
    { day: "Sun", conversations: 60 },
  ];
  
  function Analytics() {
    const maxConversations = Math.max(
      ...weeklyData.map((item) => item.conversations)
    );
  
    return (
      <div className="space-y-6 text-slate-800">
  
        {/* Heading */}
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Analytics</h2>
          <p className="mt-2 text-sm text-slate-500">
            Understand your customer conversations and AI performance.
          </p>
        </div>
  
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Conversations</p>
              <MessageSquare className="text-violet-600" size={20} />
            </div>
            <h3 className="mt-4 text-3xl font-bold">1,284</h3>
            <p className="mt-2 text-xs text-emerald-600">
              +12.8% from last month
            </p>
          </div>
  
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Resolution Rate</p>
              <CheckCircle2 className="text-emerald-600" size={20} />
            </div>
            <h3 className="mt-4 text-3xl font-bold">73.7%</h3>
            <p className="mt-2 text-xs text-emerald-600">
              AI resolved conversations
            </p>
          </div>
  
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Avg. Response Time</p>
              <Clock className="text-indigo-600" size={20} />
            </div>
            <h3 className="mt-4 text-3xl font-bold">1.8s</h3>
            <p className="mt-2 text-xs text-emerald-600">
              -12.5% from last month
            </p>
          </div>
  
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Customer Satisfaction</p>
              <TrendingUp className="text-amber-500" size={20} />
            </div>
            <h3 className="mt-4 text-3xl font-bold">94%</h3>
            <p className="mt-2 text-xs text-emerald-600">
              Positive customer feedback
            </p>
          </div>
        </div>
  
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
  
          {/* Weekly Activity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-7 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <BarChart3 size={21} />
              </div>
              <div>
                <h3 className="font-bold">Weekly Activity</h3>
                <p className="text-xs text-slate-400">
                  Customer conversations this week
                </p>
              </div>
            </div>
  
            <div className="flex h-56 items-end justify-between gap-3">
              {weeklyData.map((item) => (
                <div
                  key={item.day}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium text-slate-500">
                    {item.conversations}
                  </span>
  
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-violet-500 transition-all hover:bg-violet-700"
                    style={{
                      height: `${(item.conversations / maxConversations) * 100}%`,
                    }}
                  />
  
                  <span className="text-xs text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>
          </section>
  
          {/* Language Distribution */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-7 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Globe size={21} />
              </div>
              <div>
                <h3 className="font-bold">Language Distribution</h3>
                <p className="text-xs text-slate-400">
                  Conversations by language
                </p>
              </div>
            </div>
  
            <div className="space-y-6">
              {languageData.map((item) => (
                <div key={item.language}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{item.language}</span>
                    <span className="text-slate-500">
                      {item.percentage}%
                    </span>
                  </div>
  
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
  
        {/* AI Performance */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <TrendingUp size={21} />
            </div>
            <div>
              <h3 className="font-bold">AI Performance</h3>
              <p className="text-xs text-slate-400">
                Overview of automated customer support
              </p>
            </div>
          </div>
  
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">AI Resolved</p>
              <h4 className="mt-2 text-2xl font-bold">946</h4>
            </div>
  
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Human Escalations</p>
              <h4 className="mt-2 text-2xl font-bold">38</h4>
            </div>
  
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Languages Supported</p>
              <h4 className="mt-2 text-2xl font-bold">4</h4>
            </div>
          </div>
        </section>
  
      </div>
    );
  }
  
  export default Analytics;
  