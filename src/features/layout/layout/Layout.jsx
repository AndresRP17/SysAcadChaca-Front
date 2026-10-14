import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { pageTitleFor } from "../pageTitles";
import Notice from "../../../shared/ui/Notice";
import { useProfileReminder } from "../../profile/hooks/useProfileReminder";
import Sidebar from "../components/sideBar/Sidebar";
import Topbar from "../components/topBar/TopBar";
import "./Layout.css";

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { pathname } = useLocation();
  const profileIncomplete = useProfileReminder(pathname);

  // Titulo de la pestana del navegador segun la pantalla ("Calendario · SysAcad").
  useEffect(() => {
    document.title = `${pageTitleFor(pathname)} · SysAcad`;
  }, [pathname]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`layout-body ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Topbar onToggle={toggleSidebar} />
        <main className="main-content">
          <div className="content">
            {profileIncomplete && (
              <Notice>
                Tu perfil está incompleto. <Link to="/perfil">Completá tu teléfono y domicilio</Link>.
              </Notice>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
