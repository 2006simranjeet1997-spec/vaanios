
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";

import Overview from "./pages/Overview";
import Conversations from "./pages/Conversations";
import VoiceAssistant from "./pages/VoiceAssistant";
import SupportTickets from "./pages/SupportTickets";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
          <Route path="/tickets" element={<SupportTickets />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
