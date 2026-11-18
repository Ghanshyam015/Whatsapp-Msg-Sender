import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity, Bell, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  CreditCard, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, MoreHorizontal,
  Plug, Settings, ShieldCheck, Tags, Users, X, Zap
} from "lucide-react";
import api from "../services/api.js";

const navigation = [
  { label: "Workspace", items: [
    ["Dashboard", "/app/dashboard", LayoutDashboard],
    ["WhatsApp accounts", "/app/accounts", MessageSquare],
    ["Contacts", "/app/contacts", Users],
    ["Groups & tags", "/app/groups", Tags],
  ]},
  { label: "Messaging", items: [
    ["Campaigns", "/app/campaigns", Activity],
    ["Create campaign", "/app/create-campaign", Zap],
    ["Scheduled campaigns", "/app/scheduled", BookOpen],
    ["Message history", "/app/history", FileText],
    ["Templates", "/app/templates", MessageSquare],
    ["Automation", "/app/automation", Zap],
  ]},
  { label: "Manage", items: [
    ["API integration", "/app/integrations", Plug],
    ["Team members", "/app/team", Users],
    ["Analytics", "/app/analytics", Activity],
    ["Billing & plan", "/app/billing", CreditCard],
    ["Settings", "/app/settings", Settings],
    ["Help & support", "/app/support", CircleHelp],
  ]},
];

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    api.get("/workspace")
      .then(({ data }) => setWorkspace(data.workspace))
      .catch(error => setWorkspaceError(error.response?.data?.error || "Could not load workspace details."));
  }, []);
  const workspaceName = workspace?.name || (workspaceError ? "Workspace unavailable" : "Loading workspace…");
  function signOut() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }
  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <Link className="brand brand-sidebar" to="/app/dashboard" aria-label="Whats Send dashboard">
          <span className="brand-mark"><MessageSquare size={19} /></span>
          {!collapsed && <span>whats<span className="brand-blue">send</span></span>}
        </Link>
        <div className="workspace-switch">
          <span className="workspace-avatar">{workspaceName[0]?.toUpperCase() || "W"}</span>
          {!collapsed && <span className="workspace-name">{workspaceName}<small>{workspace?.plan || "Business workspace"}</small></span>}
          {!collapsed && <ChevronDown size={15} />}
        </div>
        <nav className="side-nav" aria-label="Business workspace">
          {navigation.map(group => <section key={group.label}>
            {!collapsed && <p className="nav-caption">{group.label}</p>}
            {group.items.map(([label, to, Icon]) => <NavLink key={to} to={to} title={collapsed ? label : undefined}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "Create campaign" && !collapsed && <span className="nav-plus">+</span>}
            </NavLink>)}
          </section>)}
        </nav>
        <div className="sidebar-bottom">
          {!collapsed && <div className="plan-meter"><div className="plan-meter-title"><span>Current plan</span><strong>{workspace?.plan || "—"}</strong></div><small>{workspaceError || "Plan and usage details"}</small><Link to="/app/billing">Manage plan <ChevronRight size={13} /></Link></div>}
          <NavLink className="nav-item admin-entry" to="/app/admin"><ShieldCheck size={18} /><span>Platform admin</span></NavLink>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />} {!collapsed && "Collapse menu"}
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="breadcrumbs"><span>{workspaceName}</span><span className="crumb-slash">/</span><strong>Workspace</strong></div>
          <div className="topbar-tools">
            <label className="global-search"><span className="sr-only">Search workspace</span><input placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
                <span className="profile-avatar">{workspaceName.slice(0, 2).toUpperCase()}</span><span className="profile-label">{workspaceName}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="profile-menu"><Link to="/app/settings" onClick={() => setProfileOpen(false)}>Workspace settings</Link><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
