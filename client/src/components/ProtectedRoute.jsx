
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Session expired or not authenticated.");
        }

        const data = await response.json();

        if (!cancelled) {
          setAuthenticated(
            Boolean(data.admin || data.user || data.id || data._id)
          );
        }
      } catch (error) {
        console.error("Authentication Error:", error);

        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            size={35}
            className="mx-auto animate-spin text-violet-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
