
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Authentication pages
import Login from "./pages/Login";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerLogin from "./pages/CustomerLogin";

// Customer pages
import CustomerPortal from "./pages/CustomerPortal";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerTickets from "./pages/CustomerTickets";

// Admin pages
import Overview from "./pages/Overview";
import Conversations from "./pages/Conversations";
import VoiceAssistant from "./pages/VoiceAssistant";
import SupportTickets from "./pages/SupportTickets";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Protect customer-only pages
function CustomerProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkCustomerSession = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/customer-auth/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (isMounted) {
          setAuthenticated(response.ok);
        }
      } catch (error) {
        console.error("Customer session check failed:", error);

        if (isMounted) {
          setAuthenticated(false);
        }
      }
    };

    checkCustomerSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Checking your session...
      </div>
    );
  }

  return authenticated ? (
    children
  ) : (
    <Navigate to="/customer/login" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ADMIN LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* CUSTOMER PUBLIC ROUTES */}
        <Route
          path="/customer"
          element={
            <Navigate to="/customer/login" replace />
          }
        />

        <Route
          path="/customer/register"
          element={<CustomerRegister />}
        />

        <Route
          path="/customer/login"
          element={<CustomerLogin />}
        />

        {/* CUSTOMER PROTECTED ROUTES */}
        <Route
          path="/customer/dashboard"
          element={
            <CustomerProtectedRoute>
              <CustomerDashboard />
            </CustomerProtectedRoute>
          }
        />

        <Route
          path="/customer/complaint"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal />
            </CustomerProtectedRoute>
          }
        />

        <Route
          path="/customer/tickets"
          element={
            <CustomerProtectedRoute>
              <CustomerTickets />
            </CustomerProtectedRoute>
          }
        />

        {/* ADMIN PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Overview />
              </DashboardLayout>
            }
          />

          <Route
            path="/conversations"
            element={
              <DashboardLayout>
                <Conversations />
              </DashboardLayout>
            }
          />

          <Route
            path="/voice-assistant"
            element={
              <DashboardLayout>
                <VoiceAssistant />
              </DashboardLayout>
            }
          />

          <Route
            path="/tickets"
            element={
              <DashboardLayout>
                <SupportTickets />
              </DashboardLayout>
            }
          />

          <Route
            path="/analytics"
            element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
        </Route>

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={
            <Navigate to="/customer/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
