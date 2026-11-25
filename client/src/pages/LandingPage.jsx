
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, ArrowRight, Headset } from "lucide-react";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-8 py-6 flex items-center gap-3">
        <div className="bg-violet-600 p-2 rounded-xl">
          <Headset size={25} />
        </div>
        <h1 className="text-2xl font-bold">VaaniOS</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-violet-400 font-semibold tracking-widest uppercase text-sm">
          Intelligent Voice Support Platform
        </p>

        <h2 className="mt-5 text-4xl md:text-6xl font-bold max-w-3xl">
          Welcome to VaaniOS
        </h2>

        <p className="mt-5 text-slate-400 max-w-xl text-lg">
          A smarter way to connect customers with support.
          Choose how you would like to continue.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button
            onClick={() => navigate("/login")}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-8 text-left hover:border-violet-500 transition"
          >
            <ShieldCheck size={38} className="text-violet-400" />

            <h3 className="text-2xl font-bold mt-6">
              Admin Portal
            </h3>

            <p className="text-slate-400 mt-3">
              Manage conversations, support tickets,
              analytics and voice assistance.
            </p>

            <span className="mt-8 flex items-center gap-2 text-violet-400 font-semibold">
              Admin Login <ArrowRight size={18} />
            </span>
          </button>

          <button
            onClick={() => navigate("/customer/login")}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-8 text-left hover:border-emerald-500 transition"
          >
            <Users size={38} className="text-emerald-400" />

            <h3 className="text-2xl font-bold mt-6">
              Customer Portal
            </h3>

            <p className="text-slate-400 mt-3">
              Register, raise complaints and track
              your support requests.
            </p>

            <span className="mt-8 flex items-center gap-2 text-emerald-400 font-semibold">
              Customer Login <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </main>

      <footer className="text-center text-slate-500 text-sm py-6">
        © 2026 VaaniOS. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
