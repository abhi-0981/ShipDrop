import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "../../components/Sidebar/Sidebar";
import TopNavbar from "../../components/Navbar/TopNavbar";

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (typeof e.detail === "boolean") {
        setCollapsed(e.detail);
      }
    };
    window.addEventListener("shipdrop:sidebarState", handleSync);
    return () => window.removeEventListener("shipdrop:sidebarState", handleSync);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f6f8fb]">
      {/* FIXED TOP NAVBAR */}
      <TopNavbar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* SIDEBAR */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* MAIN CONTENT WRAPPER */}
      <main
        className={`min-h-screen pt-[64px] transition-all duration-300 ${
          collapsed ? "pl-0" : "pl-0 lg:pl-[250px]"
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;