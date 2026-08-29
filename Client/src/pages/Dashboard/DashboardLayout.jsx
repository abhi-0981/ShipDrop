import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../../components/Sidebar/Sidebar";
import TopNavbar from "../../components/Navbar/TopNavbar";

function DashboardLayout() {
  const [collapsed, setCollapsed] =
    useState(false);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* FIXED TOP NAVBAR */}

      <TopNavbar />

      {/* SIDEBAR */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* PAGE CONTENT */}

      <div
        className={`min-h-screen p-6 pt-20 transition-all duration-300 ${
          collapsed
            ? "ml-20"
            : "ml-64"
        }`}
      >
        <Outlet />
      </div>

    </div>
  );
}

export default DashboardLayout;