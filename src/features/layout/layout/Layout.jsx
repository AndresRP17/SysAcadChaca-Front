<<<<<<< HEAD
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sideBar/Sidebar";
import Topbar from "../components/topBar/TopBar";
import "./Layout.css";

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
=======
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sideBar/Sidebar';
import Topbar from '../components/topBar/TopBar';
import './Layout.css';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
>>>>>>> origin/develop

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
<<<<<<< HEAD
      <div className={`layout-body ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Topbar onToggle={toggleSidebar} />
=======
      <div className={`layout-body ${sidebarCollapsed ? 'collapsed' : ''}`}>
       <Topbar onToggle={toggleSidebar} />
>>>>>>> origin/develop
        <main className="main-content">
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default Layout;
=======
export default Layout;
>>>>>>> origin/develop
