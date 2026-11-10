
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Conversations from "./pages/Conversations";
import VoiceAssistant from "./pages/VoiceAssistant";
import SupportTickets from "./pages/SupportTickets";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
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

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
