
import Sidebar from "./Sidebar";
import Header from "./Header";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
