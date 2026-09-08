import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sideBar/Sidebar";
import Topbar from "../components/topBar/TopBar";
import "./Layout.css";

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`layout-body ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Topbar onToggle={toggleSidebar} />
        <main className="main-content">
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
